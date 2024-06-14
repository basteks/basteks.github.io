function init(title) {
    document.title = title.replaceAll('¤',"'");
    var link = document.querySelector("link[rel~='icon']");
    if (!link) {
	link = document.createElement('link');
	link.rel = 'icon';
	document.head.appendChild(link);
    }
    link.href = 'https://symbl-world.akamaized.net/i/webp/7b/13d9d7d642bfc3bd35ce5b2e6c4138.webp';
    document.getElementById('pageTitle').innerHTML = title.replaceAll('¤',"'");
    if (document.getElementById('container')) {
	document.getElementById('container').title = title.replaceAll('¤',"'");
    }
    loadMenu();
    loadVars();
}

function loadMenu() {
    document.getElementById('mySidenav').innerHTML = "<a href='index.html'>Présentation de l'outil</a>";
    document.getElementById('mySidenav').innerHTML += "<span class='htitle'>Jeunes</span><a href='listingjeunes.html'>&#128270; Liste des jeunes</a><a href='suivijeune.html'>&#128221; Suivi des acquisitions d'un.e jeune</a>";
    document.getElementById('mySidenav').innerHTML += "<span class='htitle'>Activités</span><a href='nouvelleactivite.html'>&#128221; Saisie d'une nouvelle activité</a><a href='listingactivites.html'>&#128270; Liste des activités</a>";
    document.getElementById('mySidenav').innerHTML += "<span class='htitle'>Suivis</span><a href='nouveausuivi.html'>&#128221; Saisie d'un nouveau suivi</a><a href='listingsuivis.html'>&#128270; Liste des suivis</a>";
    document.getElementById('mySidenav').innerHTML += "<a href='rectificatifsuivi.html'>&#128221; Modification des suivis</a><a href='listingabsences.html'>&#128270; Liste des absences / annulations</a>";
}

function toggleNav() {
	if (document.getElementById('sidebarbutton').classList.contains('closed')) {
  document.getElementById("mySidenav").style.width = "300px";
  document.getElementById("main").style.marginLeft = "300px";
  document.getElementById('sidebarbutton').classList.remove('closed');
  document.getElementById('sidebarbutton').classList.add('opened');
  document.getElementById('sidebarbutton').innerHTML = "&times; Fermer"
  }
  else {
  	document.getElementById("mySidenav").style.width = "0";
    document.getElementById("main").style.marginLeft= "0";
    document.getElementById('sidebarbutton').classList.remove('opened');
    document.getElementById('sidebarbutton').classList.add('closed');
    document.getElementById('sidebarbutton').innerHTML = "&#9776; Menu"
  }
  if (bearer!=null) {
      document.getElementById('sidebarbutton').innerHTML += '<span style="float:right; text-align:right;">Équipe péda<br><button onclick="logOff()">Déconnexion</button></span>';
  }
  else {
      document.getElementById('sidebarbutton').innerHTML += '<span style="float:right; text-align:right;"><span style="color:red">Non connecté</span><br><button onclick="login()">Connexion</button></span>';
  }
}

var bearer = null;
var base_uuid = null;
var server = null;

function loadVars() {
    bearer = sessionStorage.getItem('bearer');
    base_uuid = sessionStorage.getItem('base_uuid');
    server = sessionStorage.getItem('server');
    if (bearer!=null && base_uuid!=null && server!=null) {
      document.getElementById('sidebarbutton').innerHTML += '<span style="float:right; text-align:right;">Équipe péda<br><button onclick="logOff()">Déconnexion</button></span>';
    }
    else {
      document.getElementById('sidebarbutton').innerHTML += '<span style="float:right; text-align:right;"><span style="color:red">Non connecté</span><br><button onclick="login()">Connexion</button></span>';
    }
}

function logOff() {
    sessionStorage.removeItem('bearer');
    sessionStorage.removeItem('base_uuid');
    sessionStorage.removeItem('server');
    bearer = null;
    base_uuid = null;
    server = null;
    login();
}

function login() {
    window.location.href="login.html";
}
