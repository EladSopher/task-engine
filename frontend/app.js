const API_BASE = 'http://localhost:5000/api/tasks';
const PAGE_LIMIT = 5;

const state = {
  currentPage: 1,
  statusFilter: '',
  hasNextPage: false,
};

const elements = {
  taskForm: document.getElementById('task-form'),
  titleInput: document.getElementById('title'),
  descriptionInput: document.getElementById('description'),
  titleError: document.getElementById('title-error'),
  submitBtn: document.getElementById('submit-btn'),
  submitLabel: document.getElementById('submit-label'),
  submitSpinner: document.getElementById('submit-spinner'),
  taskList: document.getElementById('task-list'),
  statusFilter: document.getElementById('status-filter'),
  pageIndicator: document.getElementById('page-indicator'),
  prevBtn: document.getElementById('prev-btn'),
  nextBtn: document.getElementById('next-btn'),
  errorBanner: document.getElementById('error-banner'),
  connectionStatus: document.getElementById('connection-status'),
};

function setConnectionStatus(connected) {
  if (connected) {
    elements.connectionStatus.className =
      'inline-flex items-center gap-2 self-start rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300';
    elements.connectionStatus.innerHTML =
      '<span class="h-2 w-2 rounded-full bg-emerald-400"></span>Connected';
    return;
  }

  elements.connectionStatus.className =
    'inline-flex items-center gap-2 self-start rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-sm text-red-300';
  elements.connectionStatus.innerHTML =
    '<span class="h-2 w-2 rounded-full bg-red-400"></span>Offline';
}

function showError(message) {
  elements.errorBanner.textContent = message;
  elements.errorBanner.classList.remove('hidden');
}

function hideError() {
  elements.errorBanner.classList.add('hidden');
  elements.errorBanner.textContent = '';
}

function getStatusBadgeClasses(status) {
  switch (status) {
    case 'completed':
      return 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300';
    case 'pending':
      return 'border-amber-500/30 bg-amber-500/15 text-amber-300';
    default:
      return 'border-slate-500/30 bg-slate-500/15 text-slate-300';
  }
}

function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function renderTasks(tasks) {
  if (!tasks.length) {
    elements.taskList.innerHTML = `
      <div class="rounded-xl border border-dashed border-white/10 bg-slate-950/40 px-6 py-16 text-center">
        <p class="text-base font-medium text-slate-300">No tasks found</p>
        <p class="mt-1 text-sm text-slate-500">Create a task or adjust your filters.</p>
      </div>
    `;
    return;
  }

  elements.taskList.innerHTML = tasks
    .map(
      (task) => `
      <article class="rounded-xl border border-white/10 bg-slate-950/50 p-5 transition hover:border-indigo-400/30 hover:bg-slate-950/70">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div class="min-w-0 flex-1">
            <h3 class="truncate text-base font-semibold text-white">${escapeHtml(task.title)}</h3>
            <p class="mt-2 text-sm leading-relaxed text-slate-400">
              ${escapeHtml(task.description || 'No description provided.')}
            </p>
            <p class="mt-3 text-xs text-slate-500">${formatDate(task.createdAt)}</p>
          </div>
          <span class="inline-flex shrink-0 self-start rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${getStatusBadgeClasses(task.status)}">
            ${escapeHtml(task.status || 'unknown')}
          </span>
        </div>
      </article>
    `
    )
    .join('');
}

function renderLoading() {
  elements.taskList.innerHTML = `
    <div class="flex items-center justify-center py-16 text-slate-400">
      <svg class="mr-3 h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
      </svg>
      Loading tasks...
    </div>
  `;
}

function updatePaginationControls() {
  elements.pageIndicator.textContent = `Page ${state.currentPage}`;
  elements.prevBtn.disabled = state.currentPage <= 1;
  elements.nextBtn.disabled = !state.hasNextPage;
}

function buildTasksUrl() {
  const params = new URLSearchParams({
    page: String(state.currentPage),
    limit: String(PAGE_LIMIT),
  });

  if (state.statusFilter) {
    params.set('status', state.statusFilter);
  }

  return `${API_BASE}?${params.toString()}`;
}

async function fetchTasks() {
  renderLoading();
  updatePaginationControls();

  try {
    const response = await fetch(buildTasksUrl());

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    const tasks = await response.json();
    state.hasNextPage = tasks.length === PAGE_LIMIT;

    hideError();
    setConnectionStatus(true);
    renderTasks(tasks);
    updatePaginationControls();
  } catch (error) {
    state.hasNextPage = false;
    setConnectionStatus(false);
    showError(
      'Unable to reach the backend API at http://localhost:5000. Make sure the server is running with npm run dev.'
    );
    elements.taskList.innerHTML = `
      <div class="rounded-xl border border-red-500/20 bg-red-500/5 px-6 py-16 text-center">
        <p class="text-base font-medium text-red-200">Failed to load tasks</p>
        <p class="mt-2 text-sm text-red-300/80">${escapeHtml(error.message)}</p>
      </div>
    `;
    updatePaginationControls();
  }
}

async function createTask(title, description) {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Server responded with status ${response.status}`);
  }

  return data;
}

function setSubmitting(isSubmitting) {
  elements.submitBtn.disabled = isSubmitting;
  elements.submitSpinner.classList.toggle('hidden', !isSubmitting);
  elements.submitLabel.textContent = isSubmitting ? 'Creating...' : 'Create Task';
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

elements.taskForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const title = elements.titleInput.value.trim();
  const description = elements.descriptionInput.value.trim();

  if (!title) {
    elements.titleError.classList.remove('hidden');
    elements.titleInput.focus();
    return;
  }

  elements.titleError.classList.add('hidden');
  setSubmitting(true);

  try {
    await createTask(title, description);
    elements.taskForm.reset();
    hideError();
    setConnectionStatus(true);
    state.currentPage = 1;
    await fetchTasks();
  } catch (error) {
    setConnectionStatus(false);
    showError(error.message || 'Failed to create task. Please try again.');
  } finally {
    setSubmitting(false);
  }
});

elements.titleInput.addEventListener('input', () => {
  if (elements.titleInput.value.trim()) {
    elements.titleError.classList.add('hidden');
  }
});

elements.statusFilter.addEventListener('change', () => {
  state.statusFilter = elements.statusFilter.value;
  state.currentPage = 1;
  fetchTasks();
});

elements.prevBtn.addEventListener('click', () => {
  if (state.currentPage > 1) {
    state.currentPage -= 1;
    fetchTasks();
  }
});

elements.nextBtn.addEventListener('click', () => {
  if (state.hasNextPage) {
    state.currentPage += 1;
    fetchTasks();
  }
});

fetchTasks();
