let {store, component} = reef;

const SERVER_API = "http://127.0.0.1:5000/database"
const projectNameInput = document.getElementById("project-name");
const projectDateInput = document.getElementById("project-duedate");
const projectStatusInput = document.getElementById("project-status");
const projectNotesInput = document.getElementById("project-notes");
const submitBtn = document.getElementById("submit-project");

// Create reactive data store
let project_data = store({
    projects: [],
})

// Get projects from server
fetch(SERVER_API)
    .then((response) => {
        if (response.ok) {
            return response.json();
        } else {
            throw Error(response.statusText);
        }
    })
    .then((jsonResponse) => {
        console.log("[INFO] Successfully fetched data")
        project_data.projects = jsonResponse;
    })
    .catch((error) => {
        toast("Data could not be fetched from server")
        console.log(`[ERROR] server data fetch error: ${error}`)
    })

// Create manager for app mode
// There are two modes,
// edit and normal
let system_state = store({
    mode: "normal",
    edit_index: "none"
})

function sortDataByDates(project_a, project_b) {
    project_a_date = Date.parse(project_a.date);
    project_b_date = Date.parse(project_b.date);

    if (project_a_date < project_b_date) {
        return -1;
    }
    if (project_a_date > project_b_date) {
        return 1;
    }
    return 0;
}

function toast(text){
    let x = document.getElementById("toast");
    x.classList.add("show");
    x.innerText = text;
    setTimeout(function(){
    x.classList.remove("show");
    }, 3000);
}

function postAPI(dry_run=false) {
    let data = JSON.stringify(project_data.projects);
    console.log("[INFO] writing JSON data to server")
    fetch(SERVER_API, {
        method: "POST",
        body: data,
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    });
}

function checkInputsFilled(inputs) {
    for (let input of inputs) {
        if (input.value.length < 1) {
            return false;
        }
    }
    return true;
}

function clearInputs(inputs) {
    for (let input of inputs) {
        input.value = "";
    }
}

function addProject(event) {
    event.preventDefault();

    let input_fields = [projectNameInput, projectDateInput, projectStatusInput];
    if (!checkInputsFilled(input_fields)) {
        toast("Please fill out the missing fields");
        return;
    }

    project_data.projects.push({
        name: projectNameInput.value,
        id: crypto.randomUUID(),
        date: projectDateInput.value,
        status: projectStatusInput.value,
        notes: projectNotesInput.value
    })

    clearInputs(input_fields);
}

function editProject(index, event) {
    event.preventDefault();

    let project = project_data.projects[index];

    projectNameInput.value = project.name;
    projectDateInput.value = project.date;
    projectStatusInput.value = project.status;
    projectNotesInput.value = project.notes;
}

function deleteProject(index, event) {
    event.preventDefault();

    project_data.projects.splice(index, 1);
}

function submitEdits(index, event) {
    console.log("[INFO] Submitting edits");
    event.preventDefault();

    let input_fields = [projectNameInput, projectDateInput, projectStatusInput];

    if (!checkInputsFilled(input_fields)) {
        toast("Please fill out the missing fields");
        console.log("[ERROR] Inputted data with missing fields");
        return;
    }

    project_data.projects[index].name = projectNameInput.value;
    project_data.projects[index].date = projectDateInput.value;
    project_data.projects[index].status = projectStatusInput.value;
    project_data.projects[index].notes = projectNotesInput.value;

    clearInputs(input_fields);
}

function clickHandler(event) {
    target = event.target;

    if (target.dataset.edit) {
        system_state.mode = "edit";
        system_state.edit_index = target.dataset.index;

        if (target.innerText == "Edit") {
            editProject(target.dataset.index, event);
        }

        if (target.innerText == "Delete") {
            deleteProject(target.dataset.index, event);
            system_state.mode = "normal";
        }
    }

    if (target.id == "submit-project") {
        if (system_state.mode == "normal") {
            addProject(event);
        }
        if (system_state.mode == "edit") {
            submitEdits(system_state.edit_index, event);
            // Reset system state after project
            // edits are done
            system_state.mode = "normal";
            system_state.edit_index = "none";
        }
    };
}

function template() {
    let html = project_data.projects.length > 0 ?
        `<table id="project-table">
            <thead>
            <tr>
                <td>Project Name</td>
                <td>Date Due</td>
                <td>Current Status</td>
                <td>Notes</td>
                <td>Manage</td>
            </tr>
            </thead>
            <tbody>
            ${project_data.projects.map(function(project, index) {
                let project_status_class = "";
                switch (project.status) {
                    case "Not yet begun":
                        project_status_class = "bg-red";
                        break;
                    case "Work ongoing":
                        project_status_class = "bg-yellow";
                        break;
                    case "Finished":
                        project_status_class = "bg-green";
                    break;
                }
                return `<tr id="${project.id}">
                    <td>${project.name}</td>
                    <td>${project.date}</td>
                    <td class="${project_status_class}">${project.status}</td>
                    <td>${project.notes}</td>
                    <td>
                        <button class="btn-blue" data-index="${index}" data-edit="1">Edit</button>
                        <button class="btn-red" data-index="${index}" data-edit="1">Delete</button>
                    </td>
                </tr>`
            }).join("")}
            </tbody>
            </table>` : "Projects list empty.";

    return html
}

// Create reactive element
component("#project-table-container", template);

document.addEventListener("click", clickHandler);
document.addEventListener("reef:store", () => {
    postAPI();
    project_data.projects.sort(sortDataByDates)
})
