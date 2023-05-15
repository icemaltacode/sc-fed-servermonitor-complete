// Globals ----------------------------------------------------------------------------------
const MODE_VIEW = 1;
const MODE_ADD = 2;
const PROMISES = [];

let SERVER_LIST = [];
let timer = undefined;

// End Globals ------------------------------------------------------------------------------

// Event Listeners --------------------------------------------------------------------------
document.addEventListener(
  "DOMContentLoaded",
  function (e) {
    loadServers();
    if (SERVER_LIST.length > 0) {
      switchMode(MODE_VIEW);
    } else {
      switchMode(MODE_ADD);
    }
  },
  false
);

document
  .getElementById("frmAddServer")
  .addEventListener("submit", function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (is_valid_input()) {
      addServer();
      document.getElementById("frmAddServer").reset();
      switchMode(MODE_VIEW);
      showServers();
    }
  });

document
  .getElementById("btnAddServer")
  .addEventListener("click", () => switchMode(MODE_ADD));

document.getElementById("btnCancelAddServer").addEventListener("click", () => {
  document.getElementById("frmAddServer").reset();
  switchMode(MODE_VIEW);
});

document.getElementById("inputName").addEventListener("keyup", isValidName);
document.getElementById("inputHost").addEventListener("keydown", isValidHost);
// End Event Listeners -----------------------------------------------------------------------

// Validation Functions ----------------------------------------------------------------------
function isValidName() {
  let serverName = document.getElementById("inputName").value;
  let valid = true;

  // Ensure server name is not empty
  if (serverName == "") {
    valid = false;
  }

  // Ensure server name is unique
  for (let server of SERVER_LIST) {
    if (server.name == serverName) {
      valid = false;
    }
  }

  if (valid) {
    document.getElementById("inputName").classList.remove("is-invalid");
    document.getElementById("inputName").classList.add("is-valid");
    document.getElementById("inputNameInvalid").style.display = "none";
  } else {
    document.getElementById("inputName").classList.remove("is-valid");
    document.getElementById("inputName").classList.add("is-invalid");
    document.getElementById("inputNameInvalid").style.display = "block";
  }

  return valid;
}

function isValidHost() {
  let serverHost = document.getElementById("inputHost").value;
  let valid = true;

  // Ensure host name is not empty
  if (serverHost == "") {
    valid = false;
  }

  // Ensure domain or IP are valid
  const domainRegex = new RegExp(
    /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/
  );
  const ipRegex = new RegExp(
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  );

  if (!serverHost.match(domainRegex) && !serverHost.match(ipRegex)) {
    valid = false;
  }

  if (valid) {
    document.getElementById("inputHost").classList.remove("is-invalid");
    document.getElementById("inputHost").classList.add("is-valid");
    document.getElementById("inputHostInvalid").style.display = "none";
  } else {
    document.getElementById("inputHost").classList.remove("is-valid");
    document.getElementById("inputHost").classList.add("is-invalid");
    document.getElementById("inputHostInvalid").style.display = "block";
  }

  return valid;
}

function is_valid_input() {
  let valid = isValidName() && isValidHost();
  return valid;
}
// End Validation Functions ------------------------------------------------------------------------------

// Program Logic -----------------------------------------------------------------------------------------
function switchMode(mode) {
  document.getElementById("serverListView").style.display = "none";
  document.getElementById("addServerView").style.display = "none";

  switch (mode) {
    case MODE_VIEW:
      document.getElementById("serverListView").style.display = "block";
      showServers();
      startMonitor();
      break;
    case MODE_ADD:
      document.getElementById("addServerView").style.display = "block";
      break;
  }
}

function loadServers() {
  if (localStorage.getItem("serverList")) {
    SERVER_LIST = JSON.parse(localStorage.getItem("serverList"));
  }
}

function addServer() {
  let serverName = document.getElementById("inputName").value;
  let serverHost = document.getElementById("inputHost").value;

  SERVER_LIST.push({
    serverName: serverName,
    serverHost: serverHost,
  });

  localStorage.setItem("serverList", JSON.stringify(SERVER_LIST));
}

function showServers() {
  let tbody = "";
  let i = 0;
  for (let server of SERVER_LIST) {
    tbody += `
            <tr>
                <td>${++i}</td>
                <td>${server.serverName}</td>
                <td>${server.serverHost}</td>
                <td id="time-${i - 1}"></td>
                <td id="status-${i - 1}"></td>
            </tr>
        `;
  }
  document.querySelector("#serverList tbody").innerHTML = tbody;
}

function startMonitor() {
  clearInterval(timer);
  checkStatus();
  timer = setInterval(checkStatus, 10000);
}

const ping = (url, timeout = 6000) => {
  return new Promise((resolve, reject) => {
    try {
      let requestTime = new Date().getTime();
      fetch(url, {
        mode: "no-cors",
      })
        .then(() => {
            let latency = new Date().getTime() - requestTime;
            resolve({"up": true, "latency": latency})
        })
        .catch(err => {
            resolve({"up": false, "error": err.message})
        });
      setTimeout(() => {
        resolve({"up": false, "error": "Connection timed out."});
      }, timeout);
    } catch (e) {
      reject(e);
    }
  });
};

async function checkStatus() {
  for (let i = 0; i < SERVER_LIST.length; i++) {
    let server = SERVER_LIST[i];
    await ping(server.serverHost)
      .then(result => {
        if (result.up) {
            document.getElementById(`status-${i}`).innerHTML = `✅ (${result.latency}ms)`;
        } else {
            let tooltip = `<a href="#" data-bs-toggle="tooltip" title="${result.error}">❌</a>`;
            document.getElementById(`status-${i}`).innerHTML = `${tooltip}`;
        }
        document.getElementById(`time-${i}`).innerHTML = `${new Date().toLocaleTimeString()}`;
      })
      .catch(result => {
        let tooltip = `<a href="#" data-bs-toggle="tooltip" title="${result.error}">❌</a>`;
        document.getElementById(`status-${i}`).innerHTML = `${tooltip}`;
        document.getElementById(`time-${i}`).innerHTML = `${new Date().getTime()}`;
      }).finally(() => {
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
      });
  }
}
// End Program Logic -------------------------------------------------------------------------------------
