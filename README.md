# Project WBS Menu

**Version:** 18.0.1.0.0  
**Author:** UNIMICS T&I Team  
**License:** LGPL-3 (Default for Odoo apps unless specified otherwise)

## Overview

The **Project WBS Menu** module extends the Odoo Project application to provide a specialized **Work Breakdown Structure (WBS)** view. Unlike the standard list or kanban views, this module introduces a hierarchical tree interface that allows users to visualize projects, tasks, and infinitely nested sub-tasks in a single, consolidated view.

It features a custom JavaScript renderer that overrides the standard list view to render a deeply nested, collapsible tree structure, making it easier to manage complex project hierarchies.

## Key Features

- **Hierarchical WBS View**: Displays a tree structure starting from Projects $\rightarrow$ Tasks $\rightarrow$ Sub-tasks (unlimited depth).
- **Custom Tree Renderer**: Uses a dedicated OWL component (`ProjectWBSRenderer`) to render the tree, providing a distinct visual layout from standard Odoo lists.
- **Deep Nesting Support**: 
  - Automatically calculates WBS levels (`wbs_level_db`) in the backend.
  - Fetches full sub-tree hierarchies efficiently using a single RPC call (`tree_get_full`).
- **Project Grouping**: Groups tasks under their respective projects automatically. Tasks without projects are grouped under a "To-do" section.
- **Interactive Elements**:
  - **Expand/Collapse**: Toggle visibility of sub-tasks with a click.
  - **Direct Links**: Click on task titles to open the standard form view.
  - **Status Indicators**: Visual badges for project names and task stages.
  - **Pagination**: Custom client-side pagination to handle large datasets smoothly.
- **Safe Permissions**: optimized backend logic to handle record rules and access rights securely (using `sudo` for structural calculations where appropriate).

## Technical Details

### Backend (`models/`)
- **`project.task`**: Extended with `tree_get_full` to return a recursive JSON structure of tasks and their children.
- **Computed Fields**: 
  - `wbs_level_db`: Stores the hierarchy depth of a task.
  - `project_label_safe`: A computed field to safely retrieve project names without triggering access errors.

### Frontend (`static/src/`)
- **JavaScript (OWL)**:
  - `project_task_tree_patch.js`: Registers `project_wbs_tree` as a custom view type. It hides the standard list table and injects a custom DOM structure (`.my_task_tree_container`).
  - Handles the "Load More", Pagination, and Expand/Collapse logic purely on the client side after fetching data.
- **XML**:
  - `tree_templates.xml` & `project_tree_view.xml`: Defines the templates for the custom renderer.
- **CSS**:
  - `tree_view.css`: Provides the styling for the tree grid, indentation, and badges.

## Installation

1. Clone this repository into your Odoo addons path:
   ```bash
   cd /path/to/your/addons
   git clone [https://github.com/metasamyar/Odoo-Discuss-Web-Push-Notifications.git](https://github.com/metasamyar/Odoo-Discuss-Web-Push-Notifications.git) project_wbs_menu