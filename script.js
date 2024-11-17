// Variável para armazenar a tarefa sendo editada
let editingTask = null;

// Função para exibir o formulário de tarefa (criar ou editar)
function showTaskForm(taskData = null) {
    const modal = document.getElementById('task-modal');
    const form = document.getElementById('task-form');

    if (taskData) {
        form.title.value = taskData.title || '';
        form.description.value = taskData.description || '';
        form.priority.value = taskData.priority || 'Média';
        form['due-date'].value = taskData.dueDate || '';
        form.responsible.value = taskData.responsible || '';
        editingTask = taskData;
        document.getElementById('task-modal-title').textContent = 'Editar Tarefa';
    } else {
        form.reset();
        document.getElementById('task-modal-title').textContent = 'Nova Tarefa';
        editingTask = null;
    }

    modal.classList.remove('d-none');
    modal.classList.add('show');
}

// Fechar o modal
function closeTaskForm() {
    const modal = document.getElementById('task-modal');
    modal.classList.add('d-none'); // Oculta o modal
    modal.classList.remove('show'); // Remove a classe que exibe o modal
}

// Função para salvar ou editar a tarefa
function saveTask() {
    const form = document.getElementById('task-form');
    const taskData = {
        title: form.title.value,
        description: form.description.value,
        priority: form.priority.value,
        dueDate: form['due-date'].value,
        responsible: form.responsible.value,
    };

    if (editingTask) {
        updateTask(taskData);
    } else {
        createNewTask(taskData);
    }

    closeTaskForm(); // Garante que o modal será fechado após salvar
}

// Função para criar uma nova tarefa
function createNewTask(taskData) {
    taskData.id = `task-${Date.now()}`; // Gera um ID único
    const task = createTaskElement(taskData);
    document.querySelector('#coluna1 .tasks').appendChild(task);
    enableDragAndDrop(); // Reativa os eventos de arrastar e soltar
    saveTasksToLocalStorage();
}

// Função para atualizar a tarefa existente
function updateTask(updatedTaskData) {
    const taskElement = document.getElementById(editingTask.id);

    // Verifica se a tarefa existe antes de tentar atualizá-la
    if (!taskElement) {
        console.error("Tarefa não encontrada para atualização: " + editingTask.id);
        return;
    }

    // Atualiza os dados no DOM
    taskElement.querySelector('h5').textContent = updatedTaskData.title;
    taskElement.querySelector('p').textContent = updatedTaskData.description;
    taskElement.dataset.priority = updatedTaskData.priority;
    taskElement.dataset.dueDate = updatedTaskData.dueDate;
    taskElement.dataset.responsible = updatedTaskData.responsible;

    // Atualiza os botões de editar e excluir
    const editButton = taskElement.querySelector('button[onclick*="editTask"]');
    editButton.onclick = () => editTask(updatedTaskData.id);
    const deleteButton = taskElement.querySelector('button[onclick*="deleteTask"]');
    deleteButton.onclick = () => deleteTask(updatedTaskData.id);

    // Salvar alterações no localStorage
    saveTasksToLocalStorage();
}

function editTask(taskId) {
    const taskElement = document.getElementById(taskId);
    const taskData = {
        id: taskId,
        title: taskElement.querySelector('h5').textContent,
        description: taskElement.querySelector('p').textContent,
        priority: taskElement.dataset.priority,
        dueDate: taskElement.dataset.dueDate,
        responsible: taskElement.dataset.responsible,
    };
    showTaskForm(taskData);
}

// Função para excluir tarefa
function deleteTask(taskId) {
    const taskElement = document.getElementById(taskId);
    
    // Verifica se a tarefa existe antes de tentar removê-la
    if (taskElement) {
        taskElement.remove();
        saveTasksToLocalStorage();  // Salva no localStorage após a exclusão
    } else {
        console.error("Tarefa não encontrada para exclusão: " + taskId);
    }
}

// Função para criar o elemento da tarefa
function createTaskElement(taskData) {
    const task = document.createElement('div');
    task.classList.add('task-card');
    task.id = taskData.id;
    task.dataset.priority = taskData.priority;
    task.dataset.dueDate = taskData.dueDate;
    task.dataset.responsible = taskData.responsible;

    task.innerHTML = `
        <h5>${taskData.title}</h5>
        <p>${taskData.description}</p>
        <p><strong>Responsável:</strong> ${taskData.responsible}</p>
        <p><strong>Vencimento:</strong> ${taskData.dueDate}</p>
        <button onclick="deleteTask('${task.id}')">Excluir</button>
        <button onclick="editTask('${task.id}')">Editar</button>
    `;

    // Habilitar a funcionalidade de arrastar e soltar
    enableDragAndDrop();

    return task;
}

// Função para habilitar arrastar e soltar
function enableDragAndDrop() {
    const tasks = document.querySelectorAll('.task-card');
    const columns = document.querySelectorAll('.kanban-column');

    tasks.forEach(task => {
        task.setAttribute('draggable', true);

        task.addEventListener('dragstart', () => {
            task.classList.add('dragging');
        });

        task.addEventListener('dragend', () => {
            task.classList.remove('dragging');
        });
    });

    columns.forEach(column => {
        column.addEventListener('dragover', (e) => {
            e.preventDefault();
            const draggingTask = document.querySelector('.dragging');
            column.querySelector('.tasks').appendChild(draggingTask);
            draggingTask.setAttribute('data-status', column.id);
            saveTasksToLocalStorage();
        });
    });
}

// Função para salvar as tarefas no localStorage
function saveTasksToLocalStorage() {
    const columns = document.querySelectorAll('.kanban-column');
    const tasks = {};

    columns.forEach(column => {
        tasks[column.id] = [];
        column.querySelectorAll('.task-card').forEach(task => {
            tasks[column.id].push({
                id: task.id,
                title: task.querySelector('h5').textContent,
                description: task.querySelector('p').textContent,
                priority: task.dataset.priority,
                dueDate: task.dataset.dueDate,
                responsible: task.dataset.responsible,
            });
        });
    });

    localStorage.setItem('kanbanTasks', JSON.stringify(tasks));
}

// Função para carregar tarefas do localStorage
function loadTasksFromLocalStorage() {
    const tasks = JSON.parse(localStorage.getItem('kanbanTasks')) || {};
    const columns = document.querySelectorAll('.kanban-column');

    if (columns.length > 0) {
        Object.keys(tasks).forEach(columnId => {
            const column = document.getElementById(columnId);
            if (column) {
                const taskContainer = column.querySelector('.tasks');
                tasks[columnId].forEach(taskData => {
                    const task = createTaskElement(taskData);
                    taskContainer.appendChild(task);
                });
            }
        });
        enableDragAndDrop();
    } else {
        console.warn("Kanban columns não encontradas.");
    }
}

// Inicializar o sistema
window.onload = () => {
    loadTasksFromLocalStorage();
};


// Função para realizar o login
document.addEventListener('DOMContentLoaded', function () {

    // Verificar se o formulário de registro está presente na página de registro
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', function (event) {
            event.preventDefault(); // Previne o envio padrão do formulário

            // Recuperar os dados do formulário
            const username = document.getElementById('register-username').value;
            const password = document.getElementById('register-password').value;

            if (username && password) {
                // Chamar a função para registrar o usuário
                registerUser(username, password);
            } else {
                alert('Por favor, preencha todos os campos!');
            }
        });
    }

    // Verificar se o formulário de login está presente na página de login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function (event) {
            event.preventDefault(); // Previne o envio padrão do formulário

            // Recuperar os dados do formulário
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;

            // Chamar a função para realizar o login
            loginUser(username, password);
        });
    }

});

// Função para registrar um novo usuário
function registerUser(username, password) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    if (users.some(user => user.username === username)) {
        alert("Usuário já existe.");
        return;
    }
    users.push({ username, password });
    localStorage.setItem('users', JSON.stringify(users));
    alert("Usuário registrado com sucesso!");
    window.location.href = 'index.html'; // Redireciona para a página de login
}

// Função para realizar o login
function loginUser(username, password) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(user => user.username === username && user.password === password);

    if (user) {
        localStorage.setItem('loggedInUser', JSON.stringify(user));
        window.location.href = 'kanban.html'; // Redireciona para a página do Kanban
    } else {
        alert("Usuário ou senha inválidos.");
    }
}

// Função para realizar o logout
function logout() {
    // Remove os dados do usuário logado
    localStorage.removeItem('loggedInUser');
    
    // Redireciona para a página de login
    window.location.href = 'index.html';
}

