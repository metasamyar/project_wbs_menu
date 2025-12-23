/** @odoo-module **/

console.log(">>> [project_wbs] TREE JS (Custom Renderer) LOADED");

import { registry } from "@web/core/registry";
import { listView } from "@web/views/list/list_view";
import { ListRenderer } from "@web/views/list/list_renderer";
import { onMounted, onWillUpdateProps } from "@odoo/owl";

// 1. (edited by samyar)Create a Custom Renderer extending the Standard ListRenderer
export class ProjectWBSRenderer extends ListRenderer {
    setup() {
        super.setup(); 

        this._treeDataFull = [];
        this._page = 1;
        this._pageSize = 80;
        this._treeContainer = null;

        onMounted(async () => {
            await this._updateTaskTree(this.props);
        });

        onWillUpdateProps(async (nextProps) => {
            await this._updateTaskTree(nextProps);
        });
    }

    async _updateTaskTree(props) {
        // 1) Locate root
        let rootEl = this.el;
        if (!rootEl) {
            rootEl = document.querySelector(".o_action_manager .o_list_view") ||
                     document.querySelector(".o_list_view");
        }
        if (!rootEl) return;

        const contentEl = rootEl.querySelector(".o_content") || rootEl;

        // 2) Hide standard Odoo pager
        const actionRoot = rootEl.closest(".o_action");
        if (actionRoot && !actionRoot.dataset._wbsPagerHidden) {
            const pager = actionRoot.querySelector(".o_control_panel .o_cp_pager");
            if (pager) {
                pager.style.display = "none";
                actionRoot.dataset._wbsPagerHidden = "1";
            }
        }

        // 3) Hide standard list table
        const table = contentEl.querySelector("table.o_list_table");
        if (table) {
             table.style.display = "none";
        }

        // 4) Create/Select our Container (FIXED LAYOUT HERE)
        let container = contentEl.querySelector(".my_task_tree_container");
        if (!container) {
            container = document.createElement("div");
            container.className = "my_task_tree_container";
            contentEl.appendChild(container);
        }
        this._treeContainer = container;

        // --- CSS FIX: Force container to fill the screen ---
        container.style.position = "absolute";
        container.style.top = "0";
        container.style.left = "0";
        container.style.right = "0";
        container.style.bottom = "0";
        container.style.backgroundColor = "white"; // Cover anything behind it
        container.style.zIndex = "100";
        container.style.overflow = "auto"; // Allow scrolling inside our container
        container.style.padding = "10px";
        // ---------------------------------------------------

        // 5) Bind handlers once
        if (!container.dataset.treeHandlersBound) {
            const actionService = this.env?.services?.action;

            container.addEventListener("click", (ev) => {
                // Toggle Logic
                const toggleEl = ev.target.closest(".my_task_toggle");
                if (toggleEl) {
                    const li = toggleEl.closest(".my_task_node");
                    if (!li) return;

                    const childUl = li.querySelector("ul.my_task_children");
                    if (!childUl) return;

                    const state = toggleEl.dataset.state || "open";
                    if (state === "open") {
                        childUl.style.display = "none";
                        toggleEl.textContent = "▸";
                        toggleEl.dataset.state = "closed";
                    } else {
                        childUl.style.display = "block";
                        toggleEl.textContent = "▾";
                        toggleEl.dataset.state = "open";
                    }
                    ev.preventDefault();
                    ev.stopPropagation();
                    return;
                }

                // Pager Prev
                const prevBtn = ev.target.closest(".my_pager_prev");
                if (prevBtn) {
                    if (this._page > 1) {
                        this._page -= 1;
                        this._renderTreePage();
                    }
                    ev.preventDefault();
                    ev.stopPropagation();
                    return;
                }

                // Pager Next
                const nextBtn = ev.target.closest(".my_pager_next");
                if (nextBtn) {
                    const totalRoots = (this._treeDataFull || []).length;
                    const totalPages = Math.max(1, Math.ceil(totalRoots / this._pageSize));
                    if (this._page < totalPages) {
                        this._page += 1;
                        this._renderTreePage();
                    }
                    ev.preventDefault();
                    ev.stopPropagation();
                    return;
                }

                // Open Task Link
                const linkEl = ev.target.closest(".my_task_link");
                if (linkEl && actionService) {
                    const id = parseInt(linkEl.dataset.taskId, 10);
                    if (!isNaN(id)) {
                        const baseCtx = (this.env.searchModel && this.env.searchModel.context) || {};
                        actionService.doAction({
                            type: "ir.actions.act_window",
                            res_model: "project.task",
                            res_id: id,
                            views: [[false, "form"]],
                            target: "current",
                            context: Object.assign({}, baseCtx, {
                                form_view_initial_mode: "readonly",
                            }),
                        });
                        ev.preventDefault();
                        ev.stopPropagation();
                    }
                }
            });

            container.dataset.treeHandlersBound = "1";
        }

        // 6) Fetch Data using RPC
        const getGroupBy = (env) => {
            const sm = env?.searchModel;
            if (!sm) return [];
            const q = (typeof sm.getQuery === "function") ? sm.getQuery() : (sm.query || sm._query || null);
            const gb = q?.groupBy || q?.group_by || sm.groupBy || sm.group_by || [];
            if (!Array.isArray(gb)) return [];
            return gb
                .map((x) => (typeof x === "string" ? x : (x?.fieldName || x?.field || x?.name)))
                .filter(Boolean);
        };

        const searchModel = this.env.searchModel;
        const domain = searchModel ? searchModel.domain : [];
        const groupBy = getGroupBy(this.env);

        const orm = this.env?.services?.orm;
        if (!orm) return;

        // Call the server-side method
        const tree = await orm.call("project.task", "tree_get_full", [domain, groupBy]);
        this._treeDataFull = tree || [];
        this._page = 1;

        // 7) Render HTML
        this._renderTreePage();
    }

    _renderTreePage() {
        if (!this._treeContainer) return;

        const fullRoots = this._treeDataFull || [];
        const totalRoots = fullRoots.length;
        const pageSize = this._pageSize || 80;

        const totalPages = Math.max(1, Math.ceil(totalRoots / pageSize));
        this._page = Math.min(Math.max(this._page, 1), totalPages);

        const startIndex = (this._page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const pageRoots = fullRoots.slice(startIndex, endIndex);

        this._treeContainer.innerHTML = this._taskTreeToHTML(pageRoots, {
            page: this._page,
            totalPages,
            totalRoots,
            start: totalRoots ? startIndex + 1 : 0,
            end: Math.min(endIndex, totalRoots),
        });
    }

    _taskTreeToHTML(nodes, meta = {}) {
        const items = (nodes || []).map((n) => this._nodeToHTML(n)).join("");

        const page = meta.page || 1;
        const totalPages = meta.totalPages || 1;
        const totalRoots = meta.totalRoots || (nodes || []).length;
        const start = meta.start ?? 1;
        const end = meta.end ?? totalRoots;

        const prevDisabled = page <= 1 ? "disabled" : "";
        const nextDisabled = page >= totalPages ? "disabled" : "";

        return `
            <div class="my_list_like">
                <div class="my_list_toolbar">
                    <div class="my_list_header">
                        <div class="my_col my_col_title">Title</div>
                        <div class="my_col my_col_level">Level</div>
                        <div class="my_col my_col_assignees">Assignees</div>
                        <div class="my_col my_col_stage">Stage</div>
                        <div class="my_col my_col_deadline">Deadline</div>
                    </div>
                    <div class="my_list_pager">
                        <button type="button" class="my_pager_prev" ${prevDisabled}>&lt;</button>
                        <span class="my_pager_info">${start}-${end} / ${totalRoots}</span>
                        <button type="button" class="my_pager_next" ${nextDisabled}>&gt;</button>
                    </div>
                </div>

                <div class="my_list_body">
                    <ul class="my_task_tree_root">
                        ${items}
                    </ul>
                </div>
            </div>
        `;
    }

    _nodeToHTML(node) {
        const isProject = !!node.is_project || node.level === 0;
        const level = Number(node.level ?? (isProject ? 0 : 1));
        const indentPx = isProject ? 0 : Math.max(0, level * 18);

        const children = node.children || [];
        const hasChildren = children.length > 0;

        const assigned = node.assigned || "";
        const stage = node.stage || "";
        const deadline = node.deadline ? String(node.deadline).split(" ")[0] : "";

        const childHtml = hasChildren
            ? `<ul class="my_task_children" style="display:none;">${children.map((c) => this._nodeToHTML(c)).join("")}</ul>`
            : "";

        const titleHtml = isProject
            ? `<span class="my_project_badge">PROJECT</span>
               <span class="my_project_title">${this._escape(node.name || "")}</span>`
            : `<a href="#" class="my_task_link" data-task-id="${node.id}">
                    ${this._escape(node.name || "")}
               </a>`;

        return `
            <li class="my_task_node ${isProject ? "my_project_node" : "my_task_item"}" data-task-id="${isProject ? "" : node.id}">
                <div class="my_task_row ${isProject ? "my_project_row" : ""}">
                    <div class="my_col my_task_tree_cell" style="padding-left:${indentPx}px">
                        ${
                            hasChildren
                                ? `<span class="my_task_toggle" data-state="closed">▸</span>`
                                : `<span class="my_task_toggle_placeholder"></span>`
                        }
                        ${titleHtml}
                    </div>

                    <div class="my_col my_task_level_cell">${isProject ? "" : level}</div>
                    <div class="my_col my_task_assignees_cell">${this._escape(assigned)}</div>
                    <div class="my_col my_task_stage_cell">${this._escape(stage)}</div>
                    <div class="my_col my_task_deadline_cell">${this._escape(deadline)}</div>
                </div>

                ${childHtml}
            </li>
        `;
    }

    _escape(str) {
        return String(str || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }
}

// 2. Register the Custom View
export const ProjectWBSListView = {
    ...listView,
    Renderer: ProjectWBSRenderer,
};

registry.category("views").add("project_wbs_tree", ProjectWBSListView);