# # -*- coding: utf-8 -*-
# from odoo import http
# from odoo.http import request
# import logging

# _logger = logging.getLogger(__name__)


# class ProjectTreeController(http.Controller):

#     @http.route("/project_tree_app/get_data", type="json", auth="user")
#     def get_data(self, search=None, **kw):
#         """
#         ساختار: پروژه → تسک → ساب‌تسک
#         همراه با سرچ روی نام پروژه/تسک/ساب‌تسک

#         خروجی هر نود:
#         {
#             "id": ...,
#             "model": "project.project" | "project.task",
#             "display_name": "...",
#             "collapsed": False,
#             "fields": {...},
#             "children": [...]
#         }
#         """

#         # ---------- گرفتن و لاگ کردن مقدار سرچ ----------
#         # اودو search رو به عنوان kw می‌فرسته
#         _logger.warning(
#             "project_tree_app.get_data called with search=%r, kw=%s, json=%s",
#             search, kw, request.jsonrequest,
#         )

#         search = (search or "").strip() if search else ""

#         Project = request.env["project.project"]
#         Task = request.env["project.task"]

#         has_user_ids = "user_ids" in Task._fields

#         # ---------- ۱) پیدا کردن پروژه‌ها ----------
#         if search:
#             # تسک‌هایی که اسم‌شان یا اسم پروژه‌شان شامل سرچ باشد
#             matched_tasks = Task.search([
#                 "|",
#                 ("name", "ilike", search),
#                 ("project_id.name", "ilike", search),
#             ])
#             project_ids_from_tasks = matched_tasks.mapped("project_id").ids

#             # پروژه‌هایی که یا اسم خودشان شامل سرچ است
#             # یا حداقل یکی از تسک‌هایشان مچ شده
#             project_domain = [
#                 "|",
#                 ("id", "in", project_ids_from_tasks),
#                 ("name", "ilike", search),
#             ]
#         else:
#             project_domain = []

#         _logger.warning("project_tree_app.get_data project_domain=%s", project_domain)

#         projects = Project.search(project_domain)

#         # ---------- ۲) توابع کمکی برای تسک‌ها ----------
#         def _assigned_name(task):
#             if has_user_ids:
#                 names = task.user_ids.mapped("name")
#                 return ", ".join(names) if names else ""
#             return task.user_id.name if task.user_id else ""

#         def _deadline_str(task):
#             dl = getattr(task, "date_deadline", False) or getattr(task, "date_end", False)
#             return str(dl) if dl else ""

#         def task_children(task):
#             domain = [("parent_id", "=", task.id)]
#             if search:
#                 domain.append(("name", "ilike", search))
#             return Task.search(domain)

#         def build_task_node(task):
#             children_tasks = task_children(task)
#             return {
#                 "id": task.id,
#                 "model": "project.task",
#                 "display_name": task.display_name,
#                 "collapsed": False,
#                 "fields": {
#                     "stage": task.stage_id.name if task.stage_id else "",
#                     "assigned": _assigned_name(task),
#                     "deadline": _deadline_str(task),
#                 },
#                 "children": [build_task_node(child) for child in children_tasks],
#             }

#         # ---------- ۳) ساخت درخت پروژه‌ها ----------
#         result = []
#         for proj in projects:
#             task_domain = [
#                 ("project_id", "=", proj.id),
#                 ("parent_id", "=", False),
#             ]
#             if search:
#                 task_domain.append(("name", "ilike", search))

#             _logger.warning(
#                 "project_tree_app.get_data task_domain for project %s = %s",
#                 proj.id, task_domain,
#             )

#             top_tasks = Task.search(task_domain)

#             proj_node = {
#                 "id": proj.id,
#                 "model": "project.project",
#                 "display_name": proj.display_name,
#                 "collapsed": False,
#                 "fields": {
#                     "manager": proj.user_id.name if proj.user_id else "",
#                     "company": proj.partner_id.name if proj.partner_id else "",
#                 },
#                 "children": [build_task_node(t) for t in top_tasks],
#             }
#             result.append(proj_node)

#         _logger.warning(
#             "project_tree_app.get_data returning %s projects (search=%r)",
#             len(result), search,
#         )

#         return result
