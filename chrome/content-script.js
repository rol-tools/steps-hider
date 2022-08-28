function sleep(ms) {
  return new Promise((resolve, reject) => setTimeout(() => resolve(true), ms));
}

function generateString(length) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = " ";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result.replace(/\s/g, "");
}

const context = {
  execution_id: "",
  getExecutionId: function () {
    return this.execution_id;
  },
  newExecutionId: function () {
    const id = generateString(5);
    this.execution_id = id;
    return id;
  },
};

function hasPageLoaded() {
  console.log("hasPageLoaded()");
  // dont know document.evaluate xPath syntax
  const finishTexts = document.querySelectorAll("div.taskrelated p strong");
  for (const node of finishTexts) {
    if (node.innerHTML === "Finish") return true;
  }
  return false;
}

async function isGuidedExercise() {
  console.log("isGuidedExercise()");
  await sleep(700); // to make sure dom updates..
  const currentP = document.querySelector("a.progress-map-bar.is-active");
  return currentP.getAttribute("title").includes("Guided Exercise");
}

function transformBlocks() {
  console.log("transformBlocks()");

  const btn = document.querySelector(`#hack-button`);

  btn.onclick = undefined;
  btn.disabled = true;
  btn.classList.add("disabled");
  //
  const blocks = document.querySelectorAll("ol.procedure li.step pre.screen");

  for (const block of blocks) {
    const id = generateString(10);

    const clonedBlock = block.cloneNode(true);
    clonedBlock.classList.add("managed");

    const fakeParent = document.createElement("div");
    fakeParent.append(clonedBlock);

    const newBlock = document.createElement("div");
    newBlock.id = `show-solution-panel-${id}`;
    newBlock.classList.add("panel-group");
    newBlock.innerHTML = `
      <div class="show-solution-panel panel panel-default">
        <div
          class="panel-collapse collapse"
          id="show-solution-panel-${id}--body"
          role="tabpanel"
          aria-labelledby="show-solution-panel-${id}--heading"
          aria-expanded="false"
        >
          <div class="panel-body">
            <ol class="substeps solution" type="1">
              <li class="step">
              ${fakeParent.innerHTML}
              </li>
            </ol>
          </div>
        </div>
        <div role="tab" id="show-solution-panel-${id}--heading" class="panel-heading">
          <div class="panel-title">
            <a
              aria-expanded="false"
              class="collapsed"
              aria-controls="show-solution-panel-${id}--body"
              role="button"
              ><button type="button" class="btn btn-black" onclick="function open(){
                const block = document.querySelector('div#show-solution-panel-${id}--body');
                const isShown = block.classList.contains('in');
                if(isShown) block.classList.remove('in');
                else block.classList.add('in');
              }; open();">Toggle Steps</button></a
            >
          </div>
        </div>
      </div>`;

    block.parentElement.replaceChild(newBlock, block);
  }
}

function addToolButton() {
  console.log("addToolButton()");
  const div = document.createElement("div");
  div.classList.add("favorite-icon-wrapper");
  div.id = "hack-button";
  div.onclick = transformBlocks;

  const btn = document.createElement("span");
  btn.classList.add("glyphicon", "glyphicon-sunglasses", "favorite-icon");
  btn.setAttribute("role", "button");
  btn.style.color = "#000";

  div.appendChild(btn);

  const container = document.querySelector("div.section-title-wrapper");
  container.appendChild(div);
}

function transformPage() {
  console.log("transformPage()");
  addToolButton();
}

async function waitForLoaded() {
  console.log("waitForLoaded()");
  let retriesLeft = 10;
  let waitMs = 1500;

  for (retriesLeft; retriesLeft > 0; retriesLeft--) {
    const loaded = hasPageLoaded();
    if (loaded) return true;
    console.log("retries left: " + retriesLeft);
    await sleep(waitMs);
  }

  return false;
}

function cleanPrevious() {
  console.log("cleanPrevious()");
  const previousButton = document.querySelector("#hack-button");
  if (previousButton) previousButton.remove();
}

function isRHL() {
  console.log("isRHL()");
  const regex = new RegExp("https://rol.redhat.com/rol/app/courses/.*/pages/.*");
  return regex.test(window.location.href);
}

async function init() {
  console.log("init()");
  const execution_id = context.newExecutionId();

  const loaded = await waitForLoaded();
  if (!loaded) {
    console.log("failed to load");
    return;
  }

  if (execution_id !== context.getExecutionId()) return;

  console.log("page has loaded");

  const isGuided = await isGuidedExercise();
  if (!isGuided) {
    console.log("is not guided exercise");
    return;
  }
  console.log("is guided exercise");

  if (execution_id !== context.getExecutionId()) return;

  return transformPage();
}

function handleNavigate() {
  console.log("handleNavigate()");
  cleanPrevious();
  if (!isRHL()) return;
  init();
}

navigation.addEventListener("navigatesuccess", handleNavigate);
