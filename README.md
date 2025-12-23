# 🚀 Odoo Project WBS Menu
> **Supercharge your Project Management with a Deep Hierarchical Tree View!**

![Odoo Version](https://img.shields.io/badge/Odoo-18.0-purple?style=for-the-badge&logo=odoo)
![License](https://img.shields.io/badge/License-LGPL--3-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge)
![Code](https://img.shields.io/badge/Made%20with-OWL%20%26%20Python-yellow?style=for-the-badge)

---

## ⚡ Overview

Tired of flat lists? **Project WBS Menu** transforms your Odoo project view into a **powerful, infinite-depth tree**. Visualize your entire project structure—from the root Project down to the smallest sub-task—in one unified, collapsible interface.

Stop clicking back and forth. **See everything at once.** 👀

---

## ✨ Key Features

### 🌳 **Infinite Hierarchy**
* **Deep Nesting:** Go as deep as you need! Projects $\rightarrow$ Tasks $\rightarrow$ Sub-tasks $\rightarrow$ Sub-sub-tasks...
* **Smart Grouping:** Automatically groups tasks under their Projects. Orphan tasks? They get their own "To-do" section.

### 🎨 **Sleek UI/UX**
* **Custom Renderer:** Built with Odoo's **OWL framework** for a snappy, reactive experience.
* **Interactive Tree:** Click `▸` to expand or `▾` to collapse branches instantly.
* **Visual Candies:** Clean badges for stages, assignee avatars (text), and deadlines.

### 🚀 **High Performance**
* **Single RPC Call:** Fetches the entire tree structure in **one go** (`tree_get_full`), keeping your server happy and your UI fast.
* **Client-Side Magic:** Pagination and expansion logic happen instantly in the browser.

---

## 🛠️ Tech Stack

* **Backend:** Python (Recursive Logic, `sudo` safe computations)
* **Frontend:** JavaScript (OWL Component System)
* **Styling:** Custom CSS Grid Layout
* **Compatibility:** Odoo 18.0 Enterprise / Community

---

## 📥 Installation

Ready to roll? Fire up your terminal! 💻

1.  **Clone the Repo:**
    ```bash
    cd /your/odoo/custom/addons
    git clone [https://github.com/metasamyar/Odoo-Discuss-Web-Push-Notifications.git](https://github.com/metasamyar/Odoo-Discuss-Web-Push-Notifications.git) project_wbs_menu
    ```

2.  **Restart Odoo:**
    ```bash
    ./odoo-bin -c odoo.conf -u project_wbs_menu
    ```

3.  **Activate:**
    Go to **Apps**, search for `Project WBS Menu`, and hit **Install**.

---

## 🎮 How to Use

1.  Open the **Project** app.
2.  Look for the **"Project WBS"** menu (usually under *Projects*).
3.  **Explore your tree:**
    * Click the **Project Title** or **Task Name** to open the form view.
    * Use the **Pager** `< >` top-right to flip through project pages.

---

## 🤝 Contributing

Got ideas? Found a bug? 🐛
Feel free to open an issue or submit a PR!

**Author:** UNIMICS T&I Team  
**Happy Coding!** 💻✨