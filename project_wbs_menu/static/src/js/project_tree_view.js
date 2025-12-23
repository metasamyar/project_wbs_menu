/** @odoo-module **/

import { registry } from "@web/core/registry";
import { Component, onWillStart, useState } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

const actionRegistry = registry.category("actions");

export class ProjectTreeApp extends Component {
    setup() {
        this.orm = useService("orm");
        this.state = useState({
            tree: [],
            loading: true,
            search: "",   // متن سرچ
        });

        onWillStart(async () => {
            await this.loadData();
        });
    }

    get domain() {
        const d = [];
        if (this.state.search) {
            // سرچ روی نام تسک (هر جور خواستی می‌تونی عوضش کنی)
            d.push(["name", "ilike", this.state.search]);
        }
        return d;
    }

    async loadData() {
        this.state.loading = true;

        // از project.task دیتا می‌خوانیم
        const tasks = await this.orm.searchRead(
            "project.task",
            this.domain,
            [
                "id",
                "name",
                "project_id",
                "parent_id",
                "user_ids",
                "stage_id",
                "company_id",
                "date_deadline",
            ],
        );

        this.state.tree = this.buildTree(tasks);
        this.state.loading = false;
    }

    buildTree(tasks) {
        const projectsMap = {};
        const result = [];

        for (const t of tasks) {
            const projectId = t.project_id && t.project_id[0];
            const projectName = t.project_id && t.project_id[1];

            if (!projectsMap[projectId]) {
                const proj = {
                    id: projectId || `no_project_${t.id}`,
                    name: projectName || "بدون پروژه",
                    manager: t.user_ids && t.user_ids.length ? t.user_ids[0][1] : "",
                    company: t.company_id && t.company_id[1],
                    tasks: [],
                };
                projectsMap[projectId] = proj;
                result.push(proj);
            }

            projectsMap[projectId].tasks.push({
                id: t.id,
                name: t.name,
                stage: t.stage_id && t.stage_id[1],
                assigned: t.user_ids && t.user_ids.length ? t.user_ids[0][1] : "",
                deadline: t.date_deadline,
            });
        }

        return result;
    }

    async onSearchInput(ev) {
        this.state.search = ev.target.value;
        await this.loadData();
    }

    openProject(projectId) {
        console.log("openProject", projectId);
        // بعداً می‌تونیم با useService("action") اکشن بازکردن پروژه رو صدا بزنیم
    }

    openTask(taskId) {
        console.log("openTask", taskId);
    }
}

ProjectTreeApp.template = "MySimpleTree.ProjectTreeView";
actionRegistry.add("project_tree_app", ProjectTreeApp);
