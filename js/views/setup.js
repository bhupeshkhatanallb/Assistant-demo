import * as projectView from "./project.js";
import * as jobPrepView from "./jobprep.js";
import * as gymView from "./gym.js";
import * as jobsView from "./jobs.js";

export function render(container, ctx) {
  container.innerHTML = `
    <div class="section-label" style="margin-top:0;">Your Project</div>
    <div id="setup-project"></div>
    <div class="section-label">Job Prep To-Dos</div>
    <div id="setup-jobprep"></div>
    <div class="section-label">Gym Plan</div>
    <div id="setup-gym"></div>
    <div class="section-label">Your Job Applications</div>
    <div id="setup-jobs"></div>
  `;
  projectView.render(container.querySelector("#setup-project"), ctx);
  jobPrepView.render(container.querySelector("#setup-jobprep"), ctx);
  gymView.render(container.querySelector("#setup-gym"), ctx);
  jobsView.render(container.querySelector("#setup-jobs"), ctx);
}
