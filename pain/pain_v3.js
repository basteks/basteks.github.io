let admin = false;
async function initQuery() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    if (urlParams.has('id')) {
	document.getElementById('notLogged').style.display='none';
	const id = urlParams.get('id');
	let data = new FormData();
	data.append('request','init');
	data.append('admin', urlParams.get('admin'));
	data.append('id', id);
	data.append('date', new Date());
	fetch("https://vps-25355c52.vps.ovh.net:6231/webhook/ca4313a2-13ea-4e05-ba44-0191838422df", {
	  method: "POST",
	  body: data
	}).then(response=> response.json())
	.then(res=> init(res) )
	.catch(err => console.error(err));
    } else {
	document.getElementById('notLogged').style.display='inline';
    }
}

async function init(res) { 
    let products = [];
    let dates = [];
    let pastorders = [];
    let acheteurs = [];
    for (let d of res) {
      switch(d.type) {
	  case 'acheteur':
	    document.getElementById('acheteur').innerHTML = d.acheteur;
	    admin = d.admin==true;
	    console.log(admin);
	    break;
	  case 'acheteurs':
	    acheteurs.push(d);
	    break;
	  case 'prod':
	    products.push(d);
	    break;
	  case 'date':
	    dates.push(d);
	    break;
	  case 'pastorder':
	    pastorders.push(d);
	} 
    }
    let dateSelect = document.getElementById('dateSelect');
    for (let d of dates) {
      document.getElementById('dateComments').innerHTML += '<p id="'+d._id+'" class="comment '+d._id+'" hidden>'+d.recup+'</p>';
      let opt = document.createElement('option');
      opt.value = d._id;
      opt.innerHTML = new Date(d.date).toLocaleDateString();
      await dateSelect.appendChild(opt);
    }
    let table = document.getElementById('alreadyOrderedBody');
    for (let p of pastorders) {
      recapLength = p.recap.split('\n').length-1;
      let row = '<tr class="pastorder '+ p._id +' ' + p.date + '" hidden>';
      row += '<td rowspan='+recapLength+'>'+p.cmd+'</td>';
      row += '<td rowspan='+recapLength+'>'+Number(p.montant).toFixed(2)+'€</td>';
      row += '<td>'+p.recap.replaceAll('\n','<br>')+'</td>';
      row += '<td rowspan='+recapLength+'><button onclick="cancelOrder('+"'"+p._id+"'"+')">Annuler</button></td>';
      row += '</tr>';
      table.innerHTML += row;
    }
    for (let p of products) {
      await newRow(p._id, p.dispos, '<table style="width:60%"><tr><td style="width:50%;"><img src="imgs/'+p._id+'.jpg"></td><td style="width:50%;text-align:left;"><span id="nom'+p._id+'">'+p.nom+'</span><br><span id="price'+p._id+'" style="font-weight:bold;">'+Number(p.prix).toFixed(2)+'€</span><span class="ppu">('+(Math.round(Number(p.prix)/Number(p.qte)*100)/100).toFixed(2)+'€/'+p.unite+')</td></tr></table>');
    }
    if (admin) {
	document.getElementById('acheteurSel').style.display='block';
	document.getElementById('acheteurShow').style.display='none';
	document.getElementById('alreadyOrdered').style.display='none';
	let acheteurSelect = document.getElementById('acheteurSelect');
	for (let a of acheteurs) {
	    let opt = document.createElement('option');
	    opt.value = a._id;
	    opt.innerHTML = a.nom;
	    await acheteurSelect.appendChild(opt);
	}
    }
    document.getElementById('dateSelect').disabled = false;
}

function deepRenameId(element, idSuffix, idNewSuffix, id) {
    if (element.nodeName=='INPUT' && element.type=='button') {
		if (element.value=="-") {
			element.onclick  = function() {update(-1,idNewSuffix)};
		}
		else if (element.value=="+" || element.value=="Ajouter") {
			element.onclick  = function() {update(1,idNewSuffix)};
		}
    }
    if (element.nodeName=='INPUT' && element.type=='text') {
	element.value = "0";
    	element.name= id;
    }
    if (element.id) {
        element.id = element.id.replace(idSuffix,idNewSuffix)
    }
    for (let i = 0; i < element.children.length; i++) {
        deepRenameId(element.children[i],idSuffix,idNewSuffix,id)
    }
}

async function newRow(id, dispos, label) {
  const node = document.getElementById("cartline");
  const clone = node.cloneNode(true);
  clone.style = "";
  clone.id = "cartline"+id;
  clone.classList.add('cartline');
  for (let d of dispos) {
      clone.classList.add(d);
  }
  deepRenameId(clone,"prd",id,id);
  await document.getElementById("cart").appendChild(clone);
  document.getElementById('label1'+id).innerHTML = label;
  document.getElementById('label3'+id).innerHTML = label;
}

function updateDate() {
    document.getElementById('loader').classList.remove('disp');
    dateTxt = document.getElementById('dateSelect').selectedOptions[0].value;
    for (doc of document.getElementsByClassName('comment')) {
	doc.hidden = !doc.classList.contains(dateTxt);
    }
    if (!admin) {
	if (document.getElementById('alreadyOrdered')) {
	    document.getElementById('alreadyOrdered').classList.add('disp');
	    for (pastorder of document.getElementsByClassName('pastorder')) {
		pastorder.hidden = !pastorder.classList.contains(dateTxt);
		if (!pastorder.hidden && document.getElementById('alreadyOrdered').classList.remove('disp')) {
		    document.getElementById('alreadyOrdered').classList.contains('disp');
		}
	    }
	}
    }
    for (prod of document.getElementsByClassName('cartline')) { 
	prod.hidden = !prod.classList.contains(dateTxt);
    }
    document.getElementById('loader').classList.add('disp');
}

async function updateAmount() {
        let res=0;
	const id_produits = document.querySelectorAll(".cartline");
	id_produits.forEach(function (idp) {
	    let id = idp.id.slice(8);
	    let qty = Number(document.getElementById('qty'+id).value);
	    let price = Number(document.getElementById('price'+id).innerText.substring(0, document.getElementById('price'+id).innerText.length - 1));
	    res += qty*price;
	});
	document.getElementById("amout").innerHTML = res.toFixed(2)+"€";
	let tomorrow = new Date(new Date().getTime() + 24 * 3600 * 1000);
	let cmdDate  = new Date(document.getElementById('dateSelect').selectedOptions[0].innerText.split('/')[2],Number(document.getElementById('dateSelect').selectedOptions[0].innerText.split('/')[1])-1,document.getElementById('dateSelect').selectedOptions[0].innerText.split('/')[0]);
	cmdDate = new Date(cmdDate.getTime() + 12 * 3600 * 1000);
	if (res>0 && (cmdDate>tomorrow || admin)) {
	    document.getElementById('order').style = "border-radius: 8px;";
	}
	else {
	    document.getElementById('order').style = "border-radius: 8px;pointer-events: none;background-color:#ccc";
	}
}

function update(iter, id) {
    let qty = Number(document.getElementById('qty'+id).value) + iter;
    document.getElementById('qty'+id).value = qty.toString();
    updateAmount()
    if (qty!=0) {
	document.getElementById('3but'+id).classList.remove('disp');
	document.getElementById('1but'+id).classList.add('disp');
    }
    if (!admin && qty==0) {
	document.getElementById('3but'+id).classList.add('disp');
	document.getElementById('1but'+id).classList.remove('disp');
    }
}

function deleteOrder(id) {
    for (var i = 0, row; row = document.getElementById('alreadyOrderedBody').rows[i]; i++) {
       if (row.classList.contains(id)) {
	   document.getElementById('alreadyOrderedBody').deleteRow(i);
	   break;
       }
    }
    updateDate();
}

function cancelOrder(id) {
    fetch("https://vps-25355c52.vps.ovh.net:6231/webhook/ca4313a2-13ea-4e05-ba44-0191838422df", {
	  method: "POST",
	  headers: {'Content-Type': 'application/json'}, 
	  body: JSON.stringify({request: 'cancel', idcmd: id})
	}).then(function(response) { //.then(response => response.json())
		 deleteOrder(id);
	  })
	  .catch(error => console.log(error));
}

function order() {
    document.getElementById('loader').classList.remove('disp');
    document.getElementById('order').style = "border-radius: 8px;pointer-events: none;background-color:#ccc";
    var toRemove = [];
    var lines = document.getElementsByClassName('cartline');
    document.getElementById('cart').style.display='none';
    for (let l=0;l<lines.length;l++) {
	 if (document.getElementById('qty'+lines[l].id.substr(8)).value==0) {
	     toRemove.push(lines[l]);
	 }
    }
    for (let l=toRemove.length-1;l>=0;l--) {
	 document.getElementById('cart').removeChild(toRemove[l]);
    }
    document.getElementById('cart').style.display='block';
    let tomorrow = new Date(new Date().getTime() + 24 * 3600 * 1000);
    let cmdDate  = new Date(document.getElementById('dateSelect').selectedOptions[0].innerText.split('/')[2],Number(document.getElementById('dateSelect').selectedOptions[0].innerText.split('/')[1])-1,document.getElementById('dateSelect').selectedOptions[0].innerText.split('/')[0]);
    cmdDate = new Date(cmdDate.getTime() + 12 * 3600 * 1000);
    if (cmdDate>tomorrow || admin) {
	let ids = [];
	let recap_cmd = '';
		
	const id_produits = document.querySelectorAll(".cartline");
	id_produits.forEach(function (idp) {
	    let id = idp.id.slice(8);
	    let qty = Number(document.getElementById('qty'+id).value);
	    if (qty>0) {
		recap_cmd+="\n- "+qty.toString()+"x "+document.getElementById('nom'+id).innerText;
		for (let k=0;k<qty;k++) {
		    ids.push(id);
		}
	    }
	});
	endOrder({status: 200});
	let acheteur_id = '';
	const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
	if (document.getElementById('acheteurSelect')) {
	    acheteur_id = document.getElementById('acheteurSelect').selectedOptions[0].value;
	}
	else if (urlParams.has('id')) {
	    const id = urlParams.get('id');
	    acheteur_id = id;
	}
	fetch("https://vps-25355c52.vps.ovh.net:6231/webhook/ca4313a2-13ea-4e05-ba44-0191838422df", {
	  method: "POST",
	  headers: {'Content-Type': 'application/json'}, 
	  body: JSON.stringify({request: 'order', recapcmd: recap_cmd, ids: ids, envoirecap: document.getElementById('envoiRecap').checked, date: document.getElementById('dateSelect').selectedOptions[0].value, acheteurid: acheteur_id})
	}).then(function(response) { //.then(response => response.json())
		 endOrder(response);
	  })
	  .catch(error => console.log(error));
    }
    else {
	endOrder({status: 99});
    }
}

function endOrder(response) {
    document.getElementById('loader').classList.add('disp');
    if (response.status == 200) {
	document.getElementById('successResult').innerHTML='<b>Merci pour votre commande !</b>';
    }
    else if (response.status == 99) {
	document.getElementById('successResult').innerHTML="<b>Désolé, la date limite de commande est dépassée 😞.</b><br>Pour rappel, la commande est envoyée à midi chaque dimanche.";
    }
    else {
	document.getElementById('successResult').innerHTML="<b>Désolé, nous avons rencontré une erreur lors de votre commande 😞.</b><br>Erreur : " + response.statusText;
    }
}
