async function initQuery() {
    document.getElementById("viewswitch").checked = "";
    document.getElementById("viewswitch").disabled = true;
    const url = window.location.search,
          params = new URLSearchParams(url);
    if (params.has("id") && params.get("id") != "") {
        document.getElementById("notLogged").style.display = "none";
        const id = params.get("id");
        let data = new FormData();
        data.append("request", "init");
        data.append("id", id);
        data.append("date", new Date());
        fetch("https://vps-25355c52.vps.ovh.net:6231/webhook/ca4313a2-13ea-4e05-ba44-0191838422df", { method: "POST", body: data })
            .then((res) => res.json())
            .then((res) => init(res))
            .catch((err) => console.error(err));
    } else document.getElementById("notLogged").style.display = "inline";
}
async function init(e) {
    let t = [],
        n = [],
        d = [],
        c = [];
    for (let o of e)
        switch (o.type) {
            case "acheteur":
                (document.getElementById("acheteur").innerHTML = o.acheteur), (admin = 1 == o.admin);
                break;
            case "acheteurs":
                c.push(o);
                break;
            case "prod":
                t.push(o);
                break;
            case "date":
                n.push(o);
                break;
            case "pastorder":
                d.push(o);  
        }
    let o = document.getElementById("dateSelect");
    for (let e of n) {
        let t = null == e.comment ? "" : e.comment;
        (document.getElementById("recupComments").innerHTML += '<p id="recup' + e._id + '" class="recup ' + e._id + '" hidden>' + e.recup + "</p>"),
            (document.getElementById("dateComments").innerHTML += '<p id="comment' + e._id + '" class="comment ' + e._id + '" hidden>' + t + "</p>");
        let n = document.createElement("option");
        (n.value = e._id), (n.innerHTML = new Date(e.date).toLocaleDateString()), await o.appendChild(n);
    }
    let a = document.getElementById("alreadyOrderedBody");
    for (let e of d) {
        recapLength = e.recap.split("\n").length - 1;
        let t = '<tr class="pastorder ' + e._id + " " + e.date + '" hidden>';
        (t += "<td rowspan=" + recapLength + ">" + e.cmd + "</td>"),
            (t += "<td rowspan=" + recapLength + ">" + Number(e.montant).toFixed(2) + "€</td>"),
            (t += "<td>" + e.recap.replaceAll("\n", "<br>") + "</td>"),
            (t += "<td rowspan=" + recapLength + "><button onclick=\"cancelOrder('" + e._id + "')\">Annuler</button></td>"),
            (t += "</tr>"),
            (a.innerHTML += t);
    }
    for (let e of t)
        await newRow(
            e._id,
            '<table style="width:60%"><tr><td style="width:50%;"><img src="imgs/' +
                e._id +
                '.jpg"></td><td style="width:50%;text-align:left;"><span id="nom' +
                e._id +
                '">' +
                e.nom +
                '</span><br><span id="price' +
                e._id +
                '" style="font-weight:bold;">' +
                Number(e.prix).toFixed(2) +
                '€</span><span class="ppu">(' +
                (Math.round((Number(e.prix) / Number(e.qte)) * 100) / 100).toFixed(2) +
                "€/" +
                e.unite +
                ")</td></tr></table>"
        );
    if (admin) {
        (document.getElementById("acheteurSel").style.display = "block"), (document.getElementById("acheteurShow").style.display = "none"), (document.getElementById("alreadyOrdered").style.display = "none");
        let e = document.getElementById("acheteurSelect");
        for (let t of c) {
            let n = document.createElement("option");
            (n.value = t._id), (n.innerHTML = t.nom), await e.appendChild(n);
        }
    }
    document.getElementById("dateSelect").disabled = !1;
}
function deepRenameId(e, t, n, d) {
    "INPUT" == e.nodeName &&
        "button" == e.type &&
        ("-" == e.value
            ? (e.onclick = function () {
                  update(-1, n);
              })
            : ("+" != e.value && "Ajouter" != e.value) ||
              (e.onclick = function () {
                  update(1, n);
              })),
        "INPUT" == e.nodeName && "text" == e.type && ((e.value = "0"), (e.name = d)),
        e.id && (e.id = e.id.replace(t, n));
    for (let c = 0; c < e.children.length; c++) deepRenameId(e.children[c], t, n, d);
}
async function newRow(e, t) {
    const n = document.getElementById("cartline").cloneNode(!0);
    (n.style = ""),
        (n.id = "cartline" + e),
        n.classList.add("cartline"),
        deepRenameId(n, "prd", e, e),
        await document.getElementById("cart").appendChild(n),
        (document.getElementById("label1" + e).innerHTML = t),
        (document.getElementById("label3" + e).innerHTML = t);
}
function updateDate() {
    for (doc of (document.getElementById("loader").classList.remove("disp"),
    (document.getElementById("viewswitch").disabled = !1),
    (document.getElementsByClassName("slider")[0].style.background = "#2196F3"),
    (dateTxt = document.getElementById("dateSelect").selectedOptions[0].value),
    document.getElementsByClassName("recup")))
        doc.hidden = !doc.classList.contains(dateTxt);
    for (doc of document.getElementsByClassName("comment")) doc.hidden = !doc.classList.contains(dateTxt);
    if (!admin && document.getElementById("alreadyOrdered"))
        for (pastorder of (document.getElementById("alreadyOrdered").classList.add("disp"), document.getElementsByClassName("pastorder")))
            (pastorder.hidden = !pastorder.classList.contains(dateTxt)), !pastorder.hidden && document.getElementById("alreadyOrdered").classList.remove("disp") && document.getElementById("alreadyOrdered").classList.contains("disp");
    for (prod of document.getElementsByClassName("cartline")) prod.hidden = !1;
    document.getElementById("loader").classList.add("disp");
}
async function updateAmount() {
    let e = 0;
    document.querySelectorAll(".cartline").forEach(function (t) {
        let n = t.id.slice(8),
            d = Number(document.getElementById("qty" + n).value),
            c = Number(document.getElementById("price" + n).innerText.substring(0, document.getElementById("price" + n).innerText.length - 1));
        e += d * c;
    }),
        (document.getElementById("amount").innerHTML = e.toFixed(2) + "€");
    let t = new Date(new Date().getTime() + 864e5),
        n = new Date(
            document.getElementById("dateSelect").selectedOptions[0].innerText.split("/")[2],
            Number(document.getElementById("dateSelect").selectedOptions[0].innerText.split("/")[1]) - 1,
            document.getElementById("dateSelect").selectedOptions[0].innerText.split("/")[0]
        );
    (n = new Date(n.getTime() + 432e5)), (document.getElementById("order").style = e > 0 && (n > t || admin) ? "border-radius: 8px;" : "border-radius: 8px;pointer-events: none;background-color:#ccc");
}
function update(e, t) {
    let n = Number(document.getElementById("qty" + t).value) + e;
    (document.getElementById("qty" + t).value = n.toString()),
        updateAmount(),
        0 != n && (document.getElementById("3but" + t).classList.remove("disp"), document.getElementById("1but" + t).classList.add("disp")),
        admin || 0 != n || (document.getElementById("3but" + t).classList.add("disp"), document.getElementById("1but" + t).classList.remove("disp"));
}
function deleteOrder(e) {
    for (var t, n = 0; (t = document.getElementById("alreadyOrderedBody").rows[n]); n++)
        if (t.classList.contains(e)) {
            document.getElementById("alreadyOrderedBody").deleteRow(n);
            break;
        }
    updateDate();
}
function cancelOrder(e) {
    fetch("https://vps-25355c52.vps.ovh.net:6231/webhook/ca4313a2-13ea-4e05-ba44-0191838422df", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ request: "cancel", idcmd: e }) })
        .then(function (t) {
            deleteOrder(e);
        })
        .catch((e) => console.log(e));
}
function toggleView() {
    (document.getElementById("cart").style.display = "none"), (document.getElementById("viewswitchlabel").title = document.getElementById("viewswitch").checked ? "Panier" : "Page de commande");
    var e = document.getElementsByClassName("cartline");
    document.getElementById("cart").style.display = "none";
    for (let t = 0; t < e.length; t++) document.getElementById("viewswitch").checked && 0 == document.getElementById("qty" + e[t].id.substr(8)).value ? (e[t].hidden = !0) : (e[t].hidden = !1);
    document.getElementById("cart").style.display = "block";
}
function order() {
    document.getElementById("loader").classList.remove("disp"),
        (document.getElementById("order").style = "border-radius: 8px;pointer-events: none;background-color:#ccc"),
        (document.getElementById("viewswitch").checked = "checked"),
        toggleView();
    let e = new Date(new Date().getTime() + 864e5),
        t = new Date(
            document.getElementById("dateSelect").selectedOptions[0].innerText.split("/")[2],
            Number(document.getElementById("dateSelect").selectedOptions[0].innerText.split("/")[1]) - 1,
            document.getElementById("dateSelect").selectedOptions[0].innerText.split("/")[0]
        );
    if (((t = new Date(t.getTime() + 432e5)), t > e || admin)) {
        let e = {},
            t = "";
        document.querySelectorAll(".cartline").forEach(function (n) {
            let d = n.id.slice(8),
                c = Number(document.getElementById("qty" + d).value);
            if (c > 0) {
                t += "\n- " + c.toString() + "x " + document.getElementById("nom" + d).innerText;
                for (let t = 0; t < c; t++) {
                    if (!(d in e)) e[d] = 1;
                    else e[d] += 1;
                }
            }
        }),
            endOrder({ status: 200 });
        let n = "";
        const d = window.location.search,
            c = new URLSearchParams(d);
        if (document.getElementById("acheteurSelect") && "none" != document.getElementById("acheteurSelect").selectedOptions[0].value) n = document.getElementById("acheteurSelect").selectedOptions[0].value;
        else if (c.has("id")) {
            n = c.get("id");
        }
        fetch("https://vps-25355c52.vps.ovh.net:6231/webhook/ca4313a2-13ea-4e05-ba44-0191838422df", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ request: "order", recapcmd: t, ids: e, envoirecap: document.getElementById("envoiRecap").checked, date: document.getElementById("dateSelect").selectedOptions[0].value, acheteurid: n }),
        })
            .then(function (e) {
                endOrder(e);
            })
            .catch((e) => console.log(e));
    } else endOrder({ status: 99 });
}
function endOrder(e) {
    document.getElementById("loader").classList.add("disp"),
        200 == e.status
            ? (document.getElementById("successResult").innerHTML = "<b>Merci pour votre commande !</b>")
            : 99 == e.status
            ? (document.getElementById("successResult").innerHTML = "<b>Désolé, la date limite de commande est dépassée 😞.</b><br>Pour rappel, la commande est envoyée avant midi chaque dimanche.")
            : (document.getElementById("successResult").innerHTML = "<b>Désolé, nous avons rencontré une erreur lors de votre commande 😞.</b><br>Erreur : " + e.statusText);
}
