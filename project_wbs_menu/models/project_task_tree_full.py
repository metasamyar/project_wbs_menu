# -*- coding: utf-8 -*-
from odoo import models, fields, api


class ProjectTask(models.Model):
    _inherit = "project.task"

    # Real DB level (not depending on domain / record rules)
    wbs_level_db = fields.Integer(
        string="WBS Level (DB)",
        compute="_compute_wbs_level_db",
        store=True,
        index=True,
        readonly=True,
    )

    # SAFE project label (stored) to avoid AccessError on project.project
    project_label_safe = fields.Char(
        string="Project Label (Safe)",
        compute="_compute_project_label_safe",
        store=True,
        index=True,
        readonly=True,
    )

    @api.depends("project_id", "project_id.name")
    def _compute_project_label_safe(self):
        # compute with sudo so users won't need runtime access to project.project
        for t in self:
            p = t.sudo().project_id
            t.project_label_safe = p.name if p else ""

    @api.depends("parent_id", "parent_id.wbs_level_db")
    def _compute_wbs_level_db(self):
        """
        Real hierarchy depth in DB:
          root task => 1
          child => parent + 1
        Uses sudo() so it’s independent from record rules.
        """
        for task in self:
            t = task.sudo()
            if not t.parent_id:
                task.wbs_level_db = 1
            else:
                task.wbs_level_db = int((t.parent_id.wbs_level_db or 1) + 1)

    @api.model
    def tree_get_full(self, *args, **kwargs):
        """
        Accept common RPC call shapes:
          orm.call("project.task","tree_get_full",[domain])
          orm.call("project.task","tree_get_full",[domain, group_by])
        """
        # -----------------------------
        # Normalize inputs
        # -----------------------------
        domain = []
        group_by = []

        if args:
            # most common: args = ([domain, group_by],)
            if len(args) == 1 and isinstance(args[0], (list, tuple)):
                payload = args[0]
                if len(payload) >= 1 and isinstance(payload[0], (list, tuple)):
                    domain = list(payload[0])
                if len(payload) >= 2:
                    group_by = payload[1]
            # sometimes: args = (domain, group_by)
            elif len(args) >= 1 and isinstance(args[0], (list, tuple)):
                domain = list(args[0])
                if len(args) >= 2:
                    group_by = args[1]

        if isinstance(kwargs.get("domain"), (list, tuple)):
            domain = list(kwargs["domain"])

        gb_kw = kwargs.get("group_by") or kwargs.get("groupby")
        if gb_kw is not None:
            group_by = gb_kw

        if not isinstance(domain, (list, tuple)):
            domain = []
        if group_by is None or group_by is False:
            group_by = []
        if isinstance(group_by, str):
            group_by = [group_by]
        if not isinstance(group_by, (list, tuple)):
            group_by = []
        group_by = [g for g in group_by if isinstance(g, str)]

        Task = self.env["project.task"]

        # -----------------------------
        # Fetch visible tasks (record rules apply)
        # -----------------------------
        tasks = Task.search(domain, order="project_id, parent_id, sequence, id")
        if not tasks:
            return []

        tasks_by_id = {t.id: t for t in tasks}

        # -----------------------------
        # Children map only inside visible set
        # -----------------------------
        children_map = {}  # {parent_id_or_0: [task_records]}
        for t in tasks:
            pid = t.parent_id.id if (t.parent_id and t.parent_id.id in tasks_by_id) else 0
            children_map.setdefault(pid, []).append(t)
        
        def _child_sort_key(t):
            # stage sequence can be False if no stage (rare), protect with 0/9999
            st_seq = t.stage_id.sequence if t.stage_id else 0
            return (st_seq, t.sequence or 0, t.id)


        def task_node(t):
            lvl = int(t.sudo().wbs_level_db or 1)
            return {
                "id": t.id,
                "name": t.display_name,
                "level": lvl,
                "assigned": ", ".join(t.user_ids.mapped("name")) if t.user_ids else "",
                "stage": t.stage_id.name if t.stage_id else "",
                "deadline": t.date_deadline.strftime("%Y-%m-%d") if t.date_deadline else "",
                "children": [],
            }

        def build_subtree(root_id):
            root_task = tasks_by_id[root_id]
            root = task_node(root_task)

            stack = [(root_id, root)]
            seen = set()

            while stack:
                tid, node = stack.pop()
                if tid in seen:
                    continue
                seen.add(tid)

                child_tasks = children_map.get(tid, [])
                if not child_tasks:
                    continue
                
                child_tasks = sorted(child_tasks, key=_child_sort_key)
                
                child_nodes = []
                for ct in child_tasks:
                    cn = task_node(ct)
                    child_nodes.append((ct.id, cn))
                
                node["children"] = [x[1] for x in child_nodes]
                

                node["children"] = [x[1] for x in child_nodes]
                for item in reversed(child_nodes):
                    stack.append(item)

            return root

        root_tasks = children_map.get(0, [])
        root_tasks = sorted(root_tasks, key=_child_sort_key)
        root_ids = [t.id for t in root_tasks]



        # -----------------------------
        # Group by project_id WITHOUT touching project.project at runtime
        # -----------------------------
        if "project_id" in group_by:
            roots_by_project = {}
            proj_labels = {}
        
            for rid in root_ids:
                t = tasks_by_id[rid]
                pid = t.project_id.id if t.project_id else 0
                roots_by_project.setdefault(pid, []).append(rid)
        
                if pid and pid not in proj_labels:
                    proj_labels[pid] = t.project_label_safe or f"Project #{pid}"
        
            # ✅ build groups in stable order: projects first, then pid=0 at the end
            result = []
        
            # projects (pid != 0) sorted by label
            project_pids = sorted(
                [pid for pid in roots_by_project.keys() if pid != 0],
                key=lambda pid: (proj_labels.get(pid, "").lower(), pid),
            )
        
            for pid in project_pids:
                proj_root_ids = roots_by_project[pid]
                result.append({
                    "id": f"project-{pid}",
                    "project_id": pid,
                    "name": proj_labels.get(pid, f"Project #{pid}"),
                    "level": 0,
                    "is_project": True,
                    "assigned": "",
                    "stage": "",
                    "deadline": "",
                    "children": [build_subtree(rid) for rid in proj_root_ids],
                })
        
            # ✅ tasks with no project: add as one final group (optional)
            no_proj_root_ids = roots_by_project.get(0, [])
            if no_proj_root_ids:
                result.append({
                    "id": "project-0",
                    "project_id": 0,
                    "name": "To-do",
                    "level": 0,
                    "is_project": True,
                    "assigned": "",
                    "stage": "",
                    "deadline": "",
                    "children": [build_subtree(rid) for rid in no_proj_root_ids],
                })
        
            return result


        return [build_subtree(rid) for rid in root_ids]
