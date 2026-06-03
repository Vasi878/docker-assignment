document.addEventListener('DOMContentLoaded', () => {
    const taskForm = document.getElementById('taskForm');
    const toastContainer = document.getElementById('toastContainer');
    const API_URL = 'http://localhost:8000/index.php';

    window.showToast = function(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px) scale(0.9)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    function fetchTasks() {
        fetch(API_URL)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderTasks(data.tasks);
            } else {
                showToast('Грешка при зареждане на задачите!');
            }
        })
        .catch(err => {
            showToast('Невъзможно свързване с бекенд сървъра!');
            console.error(err);
        });
    }

    function renderTasks(tasks) {
        const todoList = document.getElementById('todoList');
        const progressList = document.getElementById('progressList');
        const doneList = document.getElementById('doneList');

        todoList.innerHTML = '';
        progressList.innerHTML = '';
        doneList.innerHTML = '';

        tasks.forEach(task => {
            const card = createTaskCard(task);
            if (task.status === 'todo') {
                todoList.appendChild(card);
            } else if (task.status === 'in_progress') {
                progressList.appendChild(card);
            } else if (task.status === 'done') {
                doneList.appendChild(card);
            }
        });

        initializeDragAndDrop();
        updateCounters();
    }

    function createTaskCard(task) {
        const article = document.createElement('article');
        article.className = `task-card priority-${task.priority}`;
        article.draggable = true;
        article.dataset.id = task.id;

        const headerDiv = document.createElement('div');
        headerDiv.className = 'task-header';
        const h4 = document.createElement('h4');
        h4.className = 'task-title';
        h4.textContent = task.title;
        headerDiv.appendChild(h4);
        article.appendChild(headerDiv);

        if (task.description) {
            const p = document.createElement('p');
            p.className = 'task-desc';
            p.innerHTML = task.description.replace(/\n/g, '<br>');
            article.appendChild(p);
        }

        const footerDiv = document.createElement('div');
        footerDiv.className = 'task-footer';

        const prioritySpan = document.createElement('span');
        prioritySpan.className = `priority-badge ${task.priority}`;
        prioritySpan.textContent = task.priority === 'high' ? 'висок' : (task.priority === 'medium' ? 'среден' : 'нисък');
        footerDiv.appendChild(prioritySpan);

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'task-actions';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'action-btn btn-delete';
        deleteBtn.dataset.id = task.id;
        deleteBtn.title = 'Изтрий задачата';
        deleteBtn.setAttribute('aria-label', 'Изтрий');
        deleteBtn.innerHTML = `<svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`;
        
        actionsDiv.appendChild(deleteBtn);
        footerDiv.appendChild(actionsDiv);
        article.appendChild(footerDiv);

        return article;
    }

    function initializeDragAndDrop() {
        const cards = document.querySelectorAll('.task-card');
        const columns = document.querySelectorAll('.tasks-list');

        cards.forEach(card => {
            card.removeEventListener('dragstart', dragStart);
            card.addEventListener('dragstart', dragStart);
            card.removeEventListener('dragend', dragEnd);
            card.addEventListener('dragend', dragEnd);
        });

        columns.forEach(column => {
            column.removeEventListener('dragover', dragOver);
            column.addEventListener('dragover', dragOver);
            column.removeEventListener('drop', dragDrop);
            column.addEventListener('drop', dragDrop);
        });
    }

    let draggedCard = null;

    function dragStart(e) {
        draggedCard = this;
        e.dataTransfer.setData('text/plain', this.dataset.id);
        setTimeout(() => {
            this.style.opacity = '0.4';
        }, 0);
    }

    function dragEnd() {
        this.style.opacity = '1';
        draggedCard = null;
    }

    function dragOver(e) {
        e.preventDefault();
    }

    function dragDrop(e) {
        e.preventDefault();
        if (!draggedCard) return;

        const taskId = draggedCard.dataset.id;
        const newStatus = this.dataset.status;
        const oldStatus = draggedCard.parentElement.dataset.status;

        if (newStatus === oldStatus) {
            draggedCard.style.opacity = '1';
            return;
        }

        updateTaskStatus(taskId, newStatus, draggedCard, this);
    }

    function updateTaskStatus(id, status, cardElement, targetColumn) {
        const formData = new FormData();
        formData.append('action', 'update_status');
        formData.append('id', id);
        formData.append('status', status);

        fetch(API_URL, {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                targetColumn.appendChild(cardElement);
                cardElement.style.opacity = '1';
                showToast('Статусът на задачата е обновен!');
                updateCounters();
            } else {
                cardElement.style.opacity = '1';
                showToast('Грешка при промяната на статуса: ' + (data.message || ''));
            }
        })
        .catch(err => {
            cardElement.style.opacity = '1';
            showToast('Мрежова грешка при свързване!');
            console.error(err);
        });
    }

    function updateCounters() {
        const columnsList = document.querySelectorAll('.tasks-list');
        let total = 0;

        columnsList.forEach(col => {
            const status = col.dataset.status;
            const count = col.querySelectorAll('.task-card').length;
            
            const badgeId = status === 'todo' ? 'badgeTodo' : (status === 'in_progress' ? 'badgeProgress' : 'badgeDone');
            const badge = document.getElementById(badgeId);
            if (badge) badge.textContent = count;

            const statId = status === 'todo' ? 'statTodo' : (status === 'in_progress' ? 'statProgress' : 'statDone');
            const statCard = document.getElementById(statId);
            if (statCard) statCard.textContent = count;

            let emptyState = col.querySelector('.empty-state');
            if (count === 0) {
                if (!emptyState) {
                    emptyState = document.createElement('div');
                    emptyState.className = 'empty-state';
                    emptyState.textContent = 'Няма задачи в тази колона';
                    col.appendChild(emptyState);
                }
            } else if (emptyState) {
                emptyState.remove();
            }
            
            total += count;
        });

        const totalStat = document.getElementById('statTotal');
        if (totalStat) totalStat.textContent = total;
    }

    if (taskForm) {
        taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(taskForm);
            formData.append('action', 'create');

            fetch(API_URL, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showToast('Задачата е създадена успешно!');
                    taskForm.reset();
                    fetchTasks();
                } else {
                    showToast('Грешка: ' + (data.message || 'Възникна проблем.'));
                }
            })
            .catch(err => {
                showToast('Мрежова грешка!');
                console.error(err);
            });
        });
    }

    document.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.btn-delete');
        if (deleteBtn) {
            const taskId = deleteBtn.dataset.id;
            
            if (confirm('Сигурни ли сте, че искате да изтриете тази задача?')) {
                const formData = new FormData();
                formData.append('action', 'delete');
                formData.append('id', taskId);

                fetch(API_URL, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        const card = deleteBtn.closest('.task-card');
                        card.remove();
                        showToast('Задачата бе изтрита успешно!');
                        updateCounters();
                    } else {
                        showToast('Неуспешно изтриване!');
                    }
                })
                .catch(err => {
                    showToast('Мрежова грешка!');
                    console.error(err);
                });
            }
        }
    });

    fetchTasks();
});
