const OWNER = "zttahir";
const REPO = "Tahir";
const BRANCH = "main";


/*
  GitHub RAW only.
  GitHub REST API bilkul use nahi ho rahi.
*/

const RAW =
  "https://raw.githubusercontent.com/" +
  OWNER +
  "/" +
  REPO +
  "/" +
  BRANCH;


/*
  Master app list
*/

const APPS_JSON =
  RAW +
  "/apps.json";


const mainHeader =
  document.getElementById("mainHeader");

const searchInput =
  document.getElementById("searchInput");

const homePage =
  document.getElementById("homePage");

const detailsPage =
  document.getElementById("detailsPage");

const appList =
  document.getElementById("appList");

const loading =
  document.getElementById("loading");

const errorBox =
  document.getElementById("errorBox");

const errorMessage =
  document.getElementById("errorMessage");

const noResults =
  document.getElementById("noResults");

const appCount =
  document.getElementById("appCount");

const refreshBtn =
  document.getElementById("refreshBtn");

const retryBtn =
  document.getElementById("retryBtn");

const backBtn =
  document.getElementById("backBtn");


let apps = [];
let currentApp = null;


/* START */

document.addEventListener(
  "DOMContentLoaded",
  function(){

    loadApps();

  }
);


/* =========================
   LOAD MASTER JSON
========================= */

async function loadApps(){

  showLoading();


  try{

    const response =
      await fetch(
        APPS_JSON +
        "?v=" +
        Date.now(),
        {
          cache:"no-store"
        }
      );


    if(!response.ok){

      throw new Error(
        "apps.json load nahi ho rahi. HTTP " +
        response.status
      );

    }


    const appListData =
      await response.json();


    if(!Array.isArray(appListData)){

      throw new Error(
        "apps.json ka format galat hai."
      );

    }


    if(!appListData.length){

      throw new Error(
        "apps.json mein koi app nahi hai."
      );

    }


    /*
      Har app ka JSON parallel load
    */

    const results =
      await Promise.all(
        appListData.map(
          function(appName){

            return loadAppJSON(
              appName
            );

          }
        )
      );


    apps =
      results.filter(
        function(app){

          return app !== null;

        }
      );


    if(!apps.length){

      throw new Error(
        "Kisi bhi app ka JSON load nahi hua."
      );

    }


    /*
      Random order
    */

    shuffleArray(apps);


    renderApps(apps);


  }catch(error){

    console.error(
      "ZT Store Error:",
      error
    );


    showError(
      error.message
    );

  }

}


/* =========================
   LOAD INDIVIDUAL JSON
========================= */

async function loadAppJSON(
  appName
){

  try{

    /*
      Example:
      TikTok Saver
      ↓
      TikTok-Saver.json
    */

    const jsonName =
      appName
        .trim()
        .replace(/\s+/g,"-");


    const jsonURL =
      RAW +
      "/" +
      encodeURIComponent(
        jsonName
      ) +
      ".json";


    const response =
      await fetch(
        jsonURL +
        "?v=" +
        Date.now(),
        {
          cache:"no-store"
        }
      );


    if(!response.ok){

      console.warn(
        "JSON not found:",
        jsonName,
        response.status
      );

      return null;

    }


    const data =
      await response.json();


    /*
      App folder ka naam
      JSON ke media paths se
      use hoga.
    */

    let icon =
      makeMediaURL(
        data.icon,
        appName
      );


    let video = null;


    if(data.video){

      video =
        makeMediaURL(
          data.video,
          appName
        );

    }


    let screenshots = [];


    if(
      Array.isArray(
        data.screenshots
      )
    ){

      data.screenshots.forEach(
        function(file){

          if(
            typeof file ===
            "string"
          ){

            screenshots.push(
              makeMediaURL(
                file,
                appName
              )
            );

          }

        }
      );

    }


    /*
      Agar JSON mein
      sirf filename ho
      to app folder add hoga.
    */

    return {

      name:
        data.name ||
        appName,

      version:
        data.version ||
        "1.0",

      developer:
        data.developer ||
        "ZT Store",

      category:
        data.category ||
        "Apps",

      publishDate:
        data.publishDate ||
        "",

      lastUpdate:
        data.lastUpdate ||
        data.publishDate ||
        "",

      about:
        data.about ||
        "No information available.",

      icon:
        icon,

      video:
        video,

      screenshots:
        screenshots,

      download:
        data.download ||
        "#",

      updateAvailable:
        data.updateAvailable === true,

      verified:
        data.verified === true,

      folder:
        appName

    };


  }catch(error){

    console.error(
      "App JSON error:",
      appName,
      error
    );

    return null;

  }

}


/* =========================
   MEDIA URL
========================= */

function makeMediaURL(
  value,
  appName
){

  if(!value){
    return "";
  }


  /*
    Agar JSON mein already
    complete URL diya ho
  */

  if(
    value.indexOf(
      "http://"
    ) === 0 ||
    value.indexOf(
      "https://"
    ) === 0
  ){

    return value;

  }


  /*
    Agar JSON mein:
    TikTok Saver/app_icon.png
    diya ho
  */

  if(
    value.indexOf(
      "/"
    ) !== -1
  ){

    return (
      RAW +
      "/" +
      value
        .split("/")
        .map(
          function(part){

            return encodeURIComponent(
              part
            );

          }
        )
        .join("/")
    );

  }


  /*
    Agar sirf:
    app_icon.png
    diya ho
  */

  return (
    RAW +
    "/" +
    encodeURIComponent(
      appName
    ) +
    "/" +
    encodeURIComponent(
      value
    )
  );

}


/* =========================
   RANDOM
========================= */

function shuffleArray(
  array
){

  for(
    let i = array.length - 1;
    i > 0;
    i--
  ){

    const j =
      Math.floor(
        Math.random() *
        (i + 1)
      );


    const temp =
      array[i];

    array[i] =
      array[j];

    array[j] =
      temp;

  }

}


/* =========================
   RENDER APPS
========================= */

function renderApps(
  list
){

  loading.style.display =
    "none";

  errorBox.style.display =
    "none";

  noResults.style.display =
    "none";

  appList.innerHTML =
    "";


  appCount.textContent =
    list.length +
    (
      list.length === 1
        ? " app"
        : " apps"
    );


  if(!list.length){

    noResults.style.display =
      "block";

    return;

  }


  list.forEach(
    function(app){

      const card =
        document.createElement(
          "article"
        );

      card.className =
        "app-card";


      const top =
        document.createElement(
          "div"
        );

      top.className =
        "app-top";


      const icon =
        document.createElement(
          "img"
        );

      icon.className =
        "app-icon";

      icon.src =
        app.icon;

      icon.alt =
        app.name;


      const info =
        document.createElement(
          "div"
        );

      info.className =
        "app-info";


      const name =
        document.createElement(
          "h3"
        );

      name.textContent =
        app.name;


      const developer =
        document.createElement(
          "p"
        );

      developer.textContent =
        app.developer;


      const version =
        document.createElement(
          "span"
        );

      version.textContent =
        "Version " +
        app.version;


      info.appendChild(
        name
      );

      info.appendChild(
        developer
      );

      info.appendChild(
        version
      );


      top.appendChild(
        icon
      );

      top.appendChild(
        info
      );


      card.appendChild(
        top
      );


      const viewBtn =
        document.createElement(
          "button"
        );

      viewBtn.type =
        "button";

      viewBtn.className =
        "view-btn";


      viewBtn.innerHTML = `
        <svg viewBox="0 0 24 24">

          <path
            d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linejoin="round"/>

          <circle
            cx="12"
            cy="12"
            r="2.5"
            fill="none"
            stroke="currentColor"
            stroke-width="2"/>

        </svg>

        <span>View</span>
      `;


      viewBtn.addEventListener(
        "click",
        function(){

          openDetails(
            app
          );

        }
      );


      card.appendChild(
        viewBtn
      );


      appList.appendChild(
        card
      );

    }
  );

}


/* =========================
   SEARCH
========================= */

searchInput.addEventListener(
  "input",
  function(){

    const query =
      searchInput.value
        .trim()
        .toLowerCase();


    if(!query){

      renderApps(
        apps
      );

      return;

    }


    const filtered =
      apps.filter(
        function(app){

          return (

            String(
              app.name
            )
            .toLowerCase()
            .includes(query)

            ||

            String(
              app.developer
            )
            .toLowerCase()
            .includes(query)

            ||

            String(
              app.category
            )
            .toLowerCase()
            .includes(query)

          );

        }
      );


    renderApps(
      filtered
    );

  }
);


/* =========================
   DETAILS
========================= */

function openDetails(
  app
){

  currentApp =
    app;


  history.pushState(
    {
      page:"details"
    },
    "",
    "#" +
    encodeURIComponent(
      app.folder
    )
  );


  homePage.style.display =
    "none";

  mainHeader.style.display =
    "none";

  detailsPage.style.display =
    "block";


  window.scrollTo(
    0,
    0
  );


  document.getElementById(
    "detailIcon"
  ).src =
    app.icon;


  document.getElementById(
    "detailName"
  ).textContent =
    app.name;


  document.getElementById(
    "detailDeveloper"
  ).textContent =
    app.developer;


  document.getElementById(
    "detailCategory"
  ).textContent =
    app.category;


  document.getElementById(
    "downloadBtn"
  ).href =
    app.download;


  const updateBox =
    document.getElementById(
      "updateBox"
    );


  if(
    app.updateAvailable
  ){

    updateBox.style.display =
      "flex";

  }else{

    updateBox.style.display =
      "none";

  }


  document.getElementById(
    "infoVersion"
  ).textContent =
    app.version;


  document.getElementById(
    "infoPublish"
  ).textContent =
    formatDate(
      app.publishDate
    );


  document.getElementById(
    "infoUpdate"
  ).textContent =
    formatDate(
      app.lastUpdate
    );


  document.getElementById(
    "infoCategory"
  ).textContent =
    app.category;


  document.getElementById(
    "infoDeveloper"
  ).textContent =
    app.developer;


  document.getElementById(
    "about"
  ).textContent =
    app.about;


  renderPreview(
    app
  );

}


/* =========================
   PREVIEW
========================= */

function renderPreview(
  app
){

  const preview =
    document.getElementById(
      "preview"
    );


  preview.innerHTML =
    "";


  if(app.video){

    const card =
      document.createElement(
        "div"
      );

    card.className =
      "preview-card preview-video";


    const video =
      document.createElement(
        "video"
      );

    video.src =
      app.video;

    video.controls =
      true;

    video.preload =
      "metadata";

    video.playsInline =
      true;


    const label =
      document.createElement(
        "div"
      );

    label.className =
      "video-label";

    label.textContent =
      "Tutorial";


    card.appendChild(
      video
    );

    card.appendChild(
      label
    );

    preview.appendChild(
      card
    );

  }


  app.screenshots.forEach(
    function(url){

      const card =
        document.createElement(
          "div"
        );

      card.className =
        "preview-card";


      const img =
        document.createElement(
          "img"
        );

      img.src =
        url;

      img.alt =
        app.name +
        " screenshot";

      img.loading =
        "lazy";


      card.appendChild(
        img
      );


      preview.appendChild(
        card
      );

    }
  );

}


/* =========================
   BACK
========================= */

backBtn.addEventListener(
  "click",
  function(){

    history.back();

  }
);


window.addEventListener(
  "popstate",
  function(){

    goHome();

  }
);


function goHome(){

  detailsPage.style.display =
    "none";

  homePage.style.display =
    "block";

  mainHeader.style.display =
    "flex";


  currentApp =
    null;


  window.scrollTo(
    0,
    0
  );

}


/* =========================
   REFRESH
========================= */

refreshBtn.addEventListener(
  "click",
  function(){

    loadApps();

  }
);


retryBtn.addEventListener(
  "click",
  function(){

    loadApps();

  }
);


/* =========================
   LOADING
========================= */

function showLoading(){

  loading.style.display =
    "grid";

  appList.innerHTML =
    "";

  errorBox.style.display =
    "none";

  noResults.style.display =
    "none";

  appCount.textContent =
    "Loading apps...";

}


/* =========================
   ERROR
========================= */

function showError(
  message
){

  loading.style.display =
    "none";

  appList.innerHTML =
    "";

  errorBox.style.display =
    "block";

  noResults.style.display =
    "none";


  errorMessage.textContent =
    message ||
    "GitHub se apps load karne mein problem hui.";


  appCount.textContent =
    "Unable to load apps";

}


/* =========================
   DATE
========================= */

function formatDate(
  value
){

  if(!value){
    return "-";
  }


  const date =
    new Date(value);


  if(
    isNaN(
      date.getTime()
    )
  ){

    return value;

  }


  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );


  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );


  const year =
    date.getFullYear();


  return (
    day +
    "/" +
    month +
    "/" +
    year
  );

}