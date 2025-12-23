{
    "name": "Project WBS Menu",
    "version": "18.0.1.0.0",
    "summary": "Adds hierarchical WBS and deep nested grouping for tasks",
    "author": "UNIMICS T&I Team",
    "category": "Project",
    "installable": True,
    "application": False,


    "depends": [
        "web",
        "project",
    ],

    "assets": {
        "web.assets_backend": [
            "project_wbs_menu/static/src/js/project_task_tree_patch.js",
             "project_wbs_menu/static/src/css/tree_view.css",
        ],
    },

    "data": [
        "views/project_tree_views.xml",
        'views/tree_action.xml',
        "views/tree_menu.xml",
    ],
}
