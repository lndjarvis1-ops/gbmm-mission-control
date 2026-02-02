// Mission Control - Full Application Logic
class MissionControl {
  constructor() {
    this.data = null;
    this.currentView = 'kanban';
    this.currentCalendarView = 'month';
    this.currentDate = new Date();
    this.filteredTasks = [];
    this.init();
  }

  async init() {
    await this.loadData();
    this.setupEventListeners();
    this.applySettings();
    this.render();
  }

  async loadData() {
    try {
      const response = await fetch('data.json');
      this.data = await response.json();
      this.filteredTasks = this.data.tasks;
      this.updateStats();
    } catch (error) {
      console.error('Error loading data:', error);
      this.showToast('Error loading data');
    }
  }

  async saveData() {
    try {
      // In production, this would save to backend
      localStorage.setItem('missionControlData', JSON.stringify(this.data));
      this.data.meta.lastSync = new Date().toISOString();
      this.showToast('✓ Saved');
    } catch (error) {
      console.error('Error saving:', error);
      this.showToast('Error saving data');
    }
  }

  setupEventListeners() {
    // View toggles
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.switchView(e.target.dataset.view));
    });

    // Calendar view toggles
    document.querySelectorAll('.cal-view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.switchCalendarView(e.target.dataset.calView));
    });

    // New task
    document.getElementById('newTaskBtn').addEventListener('click', () => this.openNewTaskModal());
    document.getElementById('closeNewTaskModal').addEventListener('click', () => this.closeModal('newTaskModal'));
    document.getElementById('cancelNewTask').addEventListener('click', () => this.closeModal('newTaskModal'));
    document.getElementById('newTaskForm').addEventListener('submit', (e) => this.createTask(e));

    // Settings
    document.getElementById('settingsBtn').addEventListener('click', () => this.openSettingsModal());
    document.getElementById('closeSettingsModal').addEventListener('click', () => this.closeModal('settingsModal'));

    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => this.search(e.target.value));

    // Filters
    document.getElementById('filterAssignee').addEventListener('change', () => this.applyFilters());
    document.getElementById('filterProject').addEventListener('change', () => this.applyFilters());
    document.getElementById('filterPriority').addEventListener('change', () => this.applyFilters());

    // Sidebar close
    document.getElementById('closeSidebar').addEventListener('click', () => this.closeSidebar());

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));

    // Modal backdrop clicks
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal(modal.id);
      });
    });

    // Calendar navigation
    document.getElementById('calPrev').addEventListener('click', () => this.navigateCalendar(-1));
    document.getElementById('calNext').addEventListener('click', () => this.navigateCalendar(1));
    document.getElementById('calToday').addEventListener('click', () => this.goToToday());
  }

  switchView(view) {
    this.currentView = view;
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-view="${view}"]`).classList.add('active');
    document.querySelectorAll('.view-container').forEach(v => v.classList.add('hidden'));
    document.getElementById(`${view}View`).classList.remove('hidden');
    this.render();
  }

  switchCalendarView(view) {
    this.currentCalendarView = view;
    document.querySelectorAll('.cal-view-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-cal-view="${view}"]`).classList.add('active');
    this.renderCalendar();
  }

  render() {
    if (this.currentView === 'kanban') this.renderKanban();
    else if (this.currentView === 'list') this.renderList();
    else if (this.currentView === 'calendar') this.renderCalendar();
  }

  renderKanban() {
    const statuses = ['backlog', 'todo', 'doing', 'review', 'done'];
    statuses.forEach(status => {
      const column = document.querySelector(`.column-content[data-status="${status}"]`);
      const tasks = this.filteredTasks.filter(t => t.status === status);
      
      // Update count
      const count = column.closest('.kanban-column').querySelector('.column-count');
      count.textContent = tasks.length;
      
      column.innerHTML = tasks.length ? tasks.map(task => this.createTaskCard(task)).join('') : 
        `<div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <div class="empty-state-text">No tasks</div>
        </div>`;
      
      // Setup drag & drop
      this.setupDragAndDrop(column);
    });
    
    // Make cards draggable
    document.querySelectorAll('.task-card').forEach(card => {
      card.setAttribute('draggable', 'true');
      card.addEventListener('dragstart', (e) => this.handleDragStart(e));
      card.addEventListener('dragend', (e) => this.handleDragEnd(e));
      card.addEventListener('click', (e) => this.openTaskDetail(e.currentTarget.dataset.taskId));
    });
  }

  createTaskCard(task) {
    const deadline = task.deadline ? this.formatDeadline(task.deadline) : '';
    const progress = task.progress > 0 ? `
      <div class="task-progress">
        <div class="task-progress-bar" style="width: ${task.progress}%"></div>
      </div>
    ` : '';
    
    return `
      <div class="task-card" data-task-id="${task.id}" draggable="true">
        <div class="task-priority ${task.priority}"></div>
        <div class="task-project">${task.project}</div>
        <div class="task-title">${task.title}</div>
        <div class="task-meta">
          ${deadline}
          <div class="task-assignee">${this.getInitials(task.assignee)}</div>
        </div>
        ${progress}
      </div>
    `;
  }

  formatDeadline(deadline) {
    const date = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    const diff = (date - today) / (1000 * 60 * 60 * 24);
    let className = 'future';
    if (diff < 0) className = 'overdue';
    else if (diff === 0) className = 'today';
    
    return `<span class="task-deadline ${className}">${this.formatDate(deadline)}</span>`;
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  setupDragAndDrop(column) {
    column.addEventListener('dragover', (e) => {
      e.preventDefault();
      column.classList.add('drag-over');
    });
    
    column.addEventListener('dragleave', () => {
      column.classList.remove('drag-over');
    });
    
    column.addEventListener('drop', (e) => {
      e.preventDefault();
      column.classList.remove('drag-over');
      const taskId = e.dataTransfer.getData('text/plain');
      const newStatus = column.dataset.status;
      this.updateTaskStatus(taskId, newStatus);
    });
  }

  handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.taskId);
    e.target.classList.add('dragging');
  }

  handleDragEnd(e) {
    e.target.classList.remove('dragging');
  }

  updateTaskStatus(taskId, newStatus) {
    const task = this.data.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = newStatus;
      task.updatedAt = new Date().toISOString();
      this.saveData();
      this.updateStats();
      this.render();
    }
  }

  renderList() {
    const listContent = document.querySelector('.list-content');
    const byProject = {};
    
    this.filteredTasks.forEach(task => {
      if (!byProject[task.project]) byProject[task.project] = [];
      byProject[task.project].push(task);
    });
    
    listContent.innerHTML = Object.keys(byProject).map(project => `
      <div class="list-project">
        <div class="list-project-header">${project}</div>
        <div class="list-tasks">
          ${byProject[project].map(task => `
            <div class="list-task" data-task-id="${task.id}">
              <div class="task-priority ${task.priority}"></div>
              <div style="flex: 1;">
                <div class="task-title">${task.title}</div>
                <div class="task-meta">
                  ${task.deadline ? this.formatDeadline(task.deadline) : ''}
                  <span>${task.status}</span>
                </div>
              </div>
              <div class="task-assignee">${this.getInitials(task.assignee)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
    
    // Add click handlers
    document.querySelectorAll('.list-task').forEach(task => {
      task.addEventListener('click', () => this.openTaskDetail(task.dataset.taskId));
    });
  }

  renderCalendar() {
    const content = document.getElementById('calendarContent');
    if (this.currentCalendarView === 'month') {
      this.renderMonthCalendar(content);
    } else if (this.currentCalendarView === 'week') {
      content.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📅</div><div class="empty-state-title">Week View</div><div class="empty-state-text">Coming soon</div></div>';
    } else {
      content.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📅</div><div class="empty-state-title">Day View</div><div class="empty-state-text">Coming soon</div></div>';
    }
  }

  renderMonthCalendar(content) {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    document.getElementById('calDate').textContent = this.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    let html = '<div class="calendar-month">';
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(day => {
      html += `<div class="calendar-day-header">${day}</div>`;
    });
    
    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      html += `<div class="calendar-day other-month"><div class="calendar-day-number">${daysInPrevMonth - i}</div></div>`;
    }
    
    // Current month days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = date.toDateString() === today.toDateString();
      const tasksOnDate = this.getTasksForDate(date);
      
      html += `<div class="calendar-day ${isToday ? 'today' : ''}">
        <div class="calendar-day-number">${day}</div>
        <div class="calendar-day-tasks">
          ${tasksOnDate.map(t => `<span class="calendar-task-dot" style="background: var(--${t.priority})"></span>`).join('')}
        </div>
      </div>`;
    }
    
    html += '</div>';
    content.innerHTML = html;
  }

  getTasksForDate(date) {
    return this.filteredTasks.filter(task => {
      if (!task.deadline) return false;
      const taskDate = new Date(task.deadline);
      return taskDate.toDateString() === date.toDateString();
    });
  }

  navigateCalendar(direction) {
    if (this.currentCalendarView === 'month') {
      this.currentDate.setMonth(this.currentDate.getMonth() + direction);
    } else if (this.currentCalendarView === 'week') {
      this.currentDate.setDate(this.currentDate.getDate() + (direction * 7));
    } else {
      this.currentDate.setDate(this.currentDate.getDate() + direction);
    }
    this.renderCalendar();
  }

  goToToday() {
    this.currentDate = new Date();
    this.renderCalendar();
  }

  updateStats() {
    const active = this.data.tasks.filter(t => t.status !== 'done').length;
    const overdue = this.data.tasks.filter(t => {
      if (!t.deadline || t.status === 'done') return false;
      return new Date(t.deadline) < new Date();
    }).length;
    
    const today = new Date().toISOString().split('T')[0];
    const doneToday = this.data.tasks.filter(t => 
      t.status === 'done' && t.updatedAt && t.updatedAt.startsWith(today)
    ).length;
    
    const totalProgress = this.data.tasks.reduce((sum, t) => sum + (t.progress || 0), 0);
    const avgProgress = this.data.tasks.length ? Math.round(totalProgress / this.data.tasks.length) : 0;
    
    document.getElementById('statActive').textContent = active;
    document.getElementById('statOverdue').textContent = overdue;
    document.getElementById('statDoneToday').textContent = doneToday;
    document.getElementById('statProgress').textContent = `${avgProgress}%`;
  }

  applyFilters() {
    const assigneeFilter = Array.from(document.getElementById('filterAssignee').selectedOptions).map(o => o.value);
    const projectFilter = Array.from(document.getElementById('filterProject').selectedOptions).map(o => o.value);
    const priorityFilter = Array.from(document.getElementById('filterPriority').selectedOptions).map(o => o.value);
    
    this.filteredTasks = this.data.tasks.filter(task => {
      if (!assigneeFilter.includes('all') && !assigneeFilter.includes(task.assignee)) return false;
      if (!projectFilter.includes('all') && !projectFilter.includes(task.project)) return false;
      if (!priorityFilter.includes('all') && !priorityFilter.includes(task.priority)) return false;
      return true;
    });
    
    this.render();
  }

  search(query) {
    if (!query) {
      this.applyFilters();
      return;
    }
    
    query = query.toLowerCase();
    this.filteredTasks = this.data.tasks.filter(task => 
      task.title.toLowerCase().includes(query) || 
      task.notes.toLowerCase().includes(query) ||
      task.project.toLowerCase().includes(query)
    );
    this.render();
  }

  openNewTaskModal() {
    const modal = document.getElementById('newTaskModal');
    const form = document.getElementById('newTaskForm');
    
    // Populate dropdowns
    const projectSelect = form.querySelector('[name="project"]');
    projectSelect.innerHTML = this.data.projects.map(p => `<option value="${p}">${p}</option>`).join('');
    
    const assigneeSelect = form.querySelector('[name="assignee"]');
    assigneeSelect.innerHTML = this.data.assignees.map(a => `<option value="${a}">${a}</option>`).join('');
    
    modal.classList.remove('hidden');
  }

  createTask(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    const task = {
      id: `task-${Date.now()}`,
      title: formData.get('title'),
      project: formData.get('project'),
      status: formData.get('status'),
      priority: formData.get('priority'),
      assignee: formData.get('assignee'),
      deadline: formData.get('deadline') || null,
      effort: formData.get('effort'),
      progress: 0,
      nextAction: formData.get('nextAction') || '',
      tags: [],
      notes: formData.get('notes') || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.data.tasks.push(task);
    this.saveData();
    this.updateStats();
    this.applyFilters();
    this.closeModal('newTaskModal');
    form.reset();
    this.showToast('Task created');
  }

  openTaskDetail(taskId) {
    const task = this.data.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const sidebar = document.getElementById('taskSidebar');
    const content = document.getElementById('sidebarContent');
    
    content.innerHTML = `
      <div class="form-group">
        <label>Title</label>
        <input type="text" value="${task.title}" data-field="title">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Project</label>
          <select data-field="project">
            ${this.data.projects.map(p => `<option value="${p}" ${p === task.project ? 'selected' : ''}>${p}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Assignee</label>
          <select data-field="assignee">
            ${this.data.assignees.map(a => `<option value="${a}" ${a === task.assignee ? 'selected' : ''}>${a}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Status</label>
          <select data-field="status">
            <option value="backlog" ${task.status === 'backlog' ? 'selected' : ''}>Backlog</option>
            <option value="todo" ${task.status === 'todo' ? 'selected' : ''}>To Do</option>
            <option value="doing" ${task.status === 'doing' ? 'selected' : ''}>Doing</option>
            <option value="review" ${task.status === 'review' ? 'selected' : ''}>Review</option>
            <option value="done" ${task.status === 'done' ? 'selected' : ''}>Done</option>
          </select>
        </div>
        <div class="form-group">
          <label>Priority</label>
          <select data-field="priority">
            <option value="p0" ${task.priority === 'p0' ? 'selected' : ''}>🔴 P0</option>
            <option value="p1" ${task.priority === 'p1' ? 'selected' : ''}>🟠 P1</option>
            <option value="p2" ${task.priority === 'p2' ? 'selected' : ''}>🟡 P2</option>
            <option value="p3" ${task.priority === 'p3' ? 'selected' : ''}>⚪ P3</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Progress</label>
        <input type="range" min="0" max="100" value="${task.progress}" data-field="progress">
        <span id="progressValue">${task.progress}%</span>
      </div>
      <div class="form-group">
        <label>Deadline</label>
        <input type="date" value="${task.deadline || ''}" data-field="deadline">
      </div>
      <div class="form-group">
        <label>Next Action</label>
        <input type="text" value="${task.nextAction || ''}" data-field="nextAction">
      </div>
      <div class="form-group">
        <label>Notes</label>
        <textarea rows="4" data-field="notes">${task.notes || ''}</textarea>
      </div>
      <div class="form-actions">
        <button class="btn-secondary" onclick="app.deleteTask('${taskId}')">Delete</button>
        <button class="btn-secondary" onclick="app.duplicateTask('${taskId}')">Duplicate</button>
      </div>
    `;
    
    // Auto-save on change
    content.querySelectorAll('[data-field]').forEach(input => {
      input.addEventListener('change', (e) => {
        const field = e.target.dataset.field;
        task[field] = e.target.value;
        task.updatedAt = new Date().toISOString();
        this.saveData();
        this.render();
        if (field === 'progress') {
          document.getElementById('progressValue').textContent = `${e.target.value}%`;
        }
      });
    });
    
    sidebar.classList.remove('hidden');
  }

  closeSidebar() {
    document.getElementById('taskSidebar').classList.add('hidden');
  }

  deleteTask(taskId) {
    if (!confirm('Delete this task?')) return;
    this.data.tasks = this.data.tasks.filter(t => t.id !== taskId);
    this.saveData();
    this.updateStats();
    this.closeSidebar();
    this.applyFilters();
    this.showToast('Task deleted');
  }

  duplicateTask(taskId) {
    const task = this.data.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const newTask = { ...task, id: `task-${Date.now()}`, title: `${task.title} (Copy)` };
    this.data.tasks.push(newTask);
    this.saveData();
    this.closeSidebar();
    this.applyFilters();
    this.showToast('Task duplicated');
  }

  openSettingsModal() {
    const modal = document.getElementById('settingsModal');
    
    // Populate assignees
    const assigneesList = document.getElementById('assigneesList');
    assigneesList.innerHTML = this.data.assignees.map(a => 
      `<div>${a} <button onclick="app.removeAssignee('${a}')">✕</button></div>`
    ).join('');
    
    // Populate projects
    const projectsList = document.getElementById('projectsList');
    projectsList.innerHTML = this.data.projects.map(p => 
      `<div>${p} <button onclick="app.removeProject('${p}')">✕</button></div>`
    ).join('');
    
    // Set defaults
    document.getElementById('defaultViewSelect').value = this.data.settings.defaultView;
    document.getElementById('defaultCalViewSelect').value = this.data.settings.defaultCalendarView;
    
    // Add new assignee
    document.getElementById('addAssignee').onclick = () => {
      const input = document.getElementById('newAssignee');
      if (input.value) {
        this.data.assignees.push(input.value);
        input.value = '';
        this.saveData();
        this.openSettingsModal();
      }
    };
    
    // Add new project
    document.getElementById('addProject').onclick = () => {
      const input = document.getElementById('newProject');
      if (input.value) {
        this.data.projects.push(input.value);
        input.value = '';
        this.saveData();
        this.openSettingsModal();
      }
    };
    
    modal.classList.remove('hidden');
  }

  removeAssignee(name) {
    this.data.assignees = this.data.assignees.filter(a => a !== name);
    this.saveData();
    this.openSettingsModal();
  }

  removeProject(name) {
    this.data.projects = this.data.projects.filter(p => p !== name);
    this.saveData();
    this.openSettingsModal();
  }

  toggleTheme() {
    const current = document.body.dataset.theme || 'dark';
    const newTheme = current === 'dark' ? 'light' : 'dark';
    document.body.dataset.theme = newTheme;
    this.data.settings.theme = newTheme;
    this.saveData();
    document.querySelector('.theme-icon').textContent = newTheme === 'dark' ? '☀️' : '🌙';
  }

  applySettings() {
    document.body.dataset.theme = this.data.settings.theme;
    this.currentView = this.data.settings.defaultView;
    this.currentCalendarView = this.data.settings.defaultCalendarView;
    
    // Populate filter dropdowns
    const assigneeFilter = document.getElementById('filterAssignee');
    assigneeFilter.innerHTML = '<option value="all" selected>All</option>' + 
      this.data.assignees.map(a => `<option value="${a}">${a}</option>`).join('');
    
    const projectFilter = document.getElementById('filterProject');
    projectFilter.innerHTML = '<option value="all" selected>All</option>' + 
      this.data.projects.map(p => `<option value="${p}">${p}</option>`).join('');
  }

  handleKeyboard(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    if (e.key === 'n' || e.key === 'N') {
      this.openNewTaskModal();
    } else if (e.key === '/') {
      e.preventDefault();
      document.getElementById('searchInput').focus();
    } else if (e.key === 'Escape') {
      this.closeModal('newTaskModal');
      this.closeModal('settingsModal');
      this.closeSidebar();
    } else if (e.key === '?') {
      this.showShortcuts();
    }
  }

  showShortcuts() {
    document.getElementById('shortcutsModal').classList.remove('hidden');
    document.getElementById('closeShortcutsModal').onclick = () => this.closeModal('shortcutsModal');
  }

  closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
  }

  showToast(message) {
    const toast = document.getElementById('toast');
    document.getElementById('toastMessage').textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 2000);
  }
}

// Initialize app
const app = new MissionControl();
