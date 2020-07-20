// ======================================================================================================
//                                             UTIL FUNCTIONS
// ======================================================================================================

async function showAlert(message) {
	$("#alertMessage").html(message);
	$(".cstmAlertBox").css({
		display: "flex",
		opacity: "1",
		width: "30%",
		height: "30%",
	});
	$(".anbarAdd-container").css({
		filter: "brightness(40%)",
		"pointer-events": "none",
	});

	return await new Promise((resolve) => {
		$("#alertYes").click(() => {
			resolve(true);
		});
		$("#alertNo").click(() => {
			resolve(false);
		});
	});
}
function closeAlert() {
	$(".cstmAlertBox").css({
		opacity: "0",
		width: "0",
		height: "0",
	});
	$(".anbarAdd-container").css({
		filter: "brightness(100%)",
		"pointer-events": "all",
	});
	setTimeout(() => {
		$(".cstmAlertBox").css("display", "none");
	}, 600);
}

// Anbar info part
$(".closedState").click(function () {
	$(this).attr("data-isClicked", "True");
	setTimeout(() => {
		$(".openedState").attr("data-isClicked", "True");
	}, 500);
});
$(document).click((el) => {
	if (
		el.target !== $(".closedState")[0] &&
		$.inArray(el.target, $(".closedState").children())
	) {
		$(".openedState").attr("data-isClicked", "False");
		$(".closedState").attr("data-isClicked", "False");
	}
});

// ====================================================================================================
//                                         MoveableBorder part
// ====================================================================================================

var currentMousePos = { x: -1, y: -1 };
$(document).mousemove(function (event) {
	currentMousePos.x = parseInt(event.pageX);
	currentMousePos.y = parseInt(event.pageY);
});

var timeout,
	clickObj = $(".moveableBorder");
var prevMouseY = null;
var moveLineBy = null;
clickObj.mousedown(function () {
	timeout = setInterval(function () {
		if (prevMouseY !== currentMousePos.y) {
			moveLineBy += currentMousePos.y - $(".moveableBorder").offset().top;
			moveBlockBy = parseInt($(".bulks").css("height").slice(0, -2)) + moveLineBy;
			if (
				moveBlockBy < $(document).height() * 0.65 &&
				moveBlockBy > $(document).height() * 0.15
			) {
				prevMouseY = currentMousePos.y;
				$(".moveableBorder").css("top", moveLineBy);
				$(".bulks").css("height", moveBlockBy);
			} else {
				moveLineBy -= currentMousePos.y - $(".moveableBorder").offset().top;
			}
		}
	}, 1);

	return false;
});

$(".moveableBorder").dblclick(function () {
	moveLineBy = null;
	prevMouseY = null;
	$(".moveableBorder").css("top", moveLineBy);
	$(".bulks").css("height", "50%");
});

$(document).mouseup(function () {
	clearInterval(timeout);
	return false;
});

// ====================================================================================================
//                                        Page's main part logic
// ====================================================================================================

// ====================================================================================================
//                                            BULKS BLOKS's part
// ====================================================================================================
function fillBulksTable(data) {
	$(".anbarAddBulksTable").remove();

	$(".bulks-table").append("<table class='anbarAddBulksTable'></table>");
	$(".anbarAddBulksTable").append("<thead></thead>");
	$(".anbarAddBulksTable").append("<tbody></tbody>");

	$(".anbarAddBulksTable > thead").append(`<th>Begin date:</th>`);
	$(".anbarAddBulksTable > thead").append(`<th>Seller:</th>`);
	$(".anbarAddBulksTable > thead").append(`<th>Whole price:</th>`);
	$(".anbarAddBulksTable > thead").append(`<th>Cost price:</th>`);

	data.forEach((el) => {
		let row = `<tr class="single-bulk" data-id='${el.id}'>`;

		row += `<td title="${moment(el.begin_date).format("DD MMMM YYYY, h:mm:ss")}">${moment(
			el.begin_date
		).format("DD MMMM YYYY")}</td>`;
		row += `<td>${el.seller}</td>`;
		row += `<td>${el.whole_price}</td>`;
		row += `<td>${el.cost_price}</td>`;

		row += "</tr>";
		$(".anbarAddBulksTable > tbody").append(row);
	});

	// Fill empty tables
	if (data.length < 9) {
		for (let i = 0; i < 9 - data.length; i++) {
			let row = "<tr class='empty-single-bulk' style='height: 40px'>";

			for (let j = 0; j < 4; j++) {
				row += "<td></td>";
			}

			row += "</tr>";

			$(".anbarAddBulksTable > tbody").append(row);
		}
	}

	$(".single-bulk").click(function () {
		$(".single-bulk").attr("data-isSelected2", "False");
		$(this).attr("data-isSelected2", "True");
		getBulkSessions($(this).attr("data-id"));
	});
	$(".single-bulk").contextmenu(function () {
		showSingleBulkOptions($(this));
	});
	$(".empty-single-bulk").contextmenu(function () {
		showSingleBulkOptions($(this));
	});
}
function getAllBulks(date_from, date_to) {
	poolConnect.then((pool) => {
		pool
			.request()
			.input("date_from", date_from)
			.input("date_to", date_to)
			.execute("dbo.bulk_buying_selection", (err, res) => {
				if (err !== null) console.log(err);
				fillBulksTable(res.recordset);
			});
	});
}
function refreshBulksTable(timeout = 0) {
	setTimeout(() => {
		getAllBulks(
			moment($("#date_from").val()).format("yyyy-MM-DD HH:mm:ss"),
			moment($("#date_to").val()).format("yyyy-MM-DD HH:mm:ss")
		);
	}, timeout);
}
function deleteBulk(id) {
	poolConnect.then((pool) => {
		pool
			.request()
			.input("id", id)
			.execute("dbo.bulk_buying_delete", (err) => {
				if (err !== null) console.log(err);
			});
	});
}
function addNewBulk(begin_date, seller_id) {
	poolConnect.then((pool) => {
		pool
			.request()
			.input("begin_date", begin_date)
			.input("seller_id", seller_id)
			.execute("dbo.bulk_buying_create", (err) => {
				if (err !== null) console.log(err);
				return;
			});
	});
}
async function showAddNewBulkForm() {
	// Preparing form
	$("#addNewBulkSellers").empty();
	let sellersData = await new Promise((resolve) => {
		poolConnect.then((pool) => {
			pool.request().execute("dbo.product_sellers_select", (err, res) => {
				if (err !== null) console.log(err);
				resolve(res.recordset);
			});
		});
	});
	for (let i = 0; i < sellersData.length; i++) {
		$("#addNewBulkSellers").append(
			`<option data-id="${sellersData[i].id}">${sellersData[i].seller}</option>`
		);
	}

	let now = new Date();
	let day = ("0" + now.getDate()).slice(-2);
	let month = ("0" + (now.getMonth() + 1)).slice(-2);
	let today = now.getFullYear() + "-" + month + "-" + day;
	$("#addNewBulkBeginDate").val(today);

	// Showing Form
	$(".anbarAdd-container").css({
		"pointer-events": "none",
	});
	$(".addNewBulkForm").css({
		opacity: "1",
		display: "flex",
		"pointer-events": "all",
	});
	$(".addNewBulkForm").attr("data-isActive", "True");
}
function hideAddNewBulkForm() {
	$(".anbarAdd-container").css({
		"pointer-events": "all",
	});
	$(".addNewBulkForm").css({
		opacity: "0",
	});
	$(".addNewBulkForm").attr("data-isActive", "False");
	setTimeout(() => {
		$(".addNewBulkForm").css("display", "none");
	}, 600);
}
$("#addNewBulkDiscardBtn").click(() => {
	hideAddNewBulkForm();
});
$("#addNewBulkSubmitBtn").click(() => {
	addNewBulk(
		moment($("#addNewBulkBeginDate").val()).format("yyyy-MM-DD HH:mm:ss"),
		$("#addNewBulkSellers").children("option:selected").attr("data-id")
	);
	refreshBulksTable(600);
	hideAddNewBulkForm();
});
function showSingleBulkOptions(bulkEl) {
	$("#optionsAccept").hide();
	if (bulkEl.attr("class") === "empty-single-bulk") {
		$(".single-bulk").attr("data-isSelected", "False");
		$(".optionsBtn").attr("data-isActive", "False");
		$("#optionsDelete").hide();
		$("#optionsMenu").attr("data-belongsTo", "Bulks");
		$("#optionsMenu").css({
			top:
				currentMousePos.y -
				$(document).height() * 0.09 -
				$($(".optionsBtn")[0]).height() / 2 +
				5,
			left: currentMousePos.x - $($(".optionsBtn")[0]).height() / 2 - 15,
		});

		$("#optionsNew").attr("title", "Add new session");
		$(".optionsBtn").attr("data-isActive", "True");
		return;
	}

	$(".single-bulk").attr("data-isSelected", "False");
	$(".optionsBtn").attr("data-isActive", "False");
	$("#optionsDelete").show();
	$("#optionsMenu").attr("data-belongsTo", "Bulks");
	$("#optionsMenu").css({
		top:
			currentMousePos.y -
			$(document).height() * 0.09 -
			$($(".optionsBtn")[0]).height() / 2 +
			5,
		left: currentMousePos.x - $($(".optionsBtn")[0]).height() / 2 - 15,
	});
	bulkEl.attr("data-isSelected", "True");
	$("#optionsDelete").attr("data-bulkId", bulkEl.attr("data-id"));
	$("#optionsDelete").attr("title", "Delete bulk");
	$("#optionsNew").attr("title", "Add new bulk");
	$(".optionsBtn").attr("data-isActive", "True");
}
$("#optionsDelete").click(function () {
	if ($("#optionsMenu").attr("data-belongsTo") !== "Bulks") {
		return;
	}
	showAlert("Are you sure you want to delete this bulk?").then((res) => {
		if (res) {
			deleteBulk($(this).attr("data-bulkId"));
			refreshBulksTable(600);
		}
		closeAlert();
	});
});
$("#optionsNew").click(function () {
	if ($("#optionsMenu").attr("data-belongsTo") !== "Bulks") {
		return;
	}
	showAddNewBulkForm();
});
$(document).click((el) => {
	$(".single-bulk").attr("data-isSelected", "False");
	$(".optionsBtn").attr("data-isActive", "False");

	if ($(".addNewBulkForm").attr("data-isActive") === "True") {
		if (
			$(el.target).attr("class") !== "addNewBulkForm" &&
			$.inArray(el.target, $(".addNewBulkForm").children()) < 0 &&
			$.inArray($(el.target).parent()[0], $(".addNewBulkForm").children()) < 0 &&
			$.inArray($(el.target).parent().parent()[0], $(".addNewBulkForm").children()) < 0
		) {
			hideAddNewBulkForm();
		}
	}
});

// ====================================================================================================
//                                       BULKS SESSIONS BLOKS's part
// ====================================================================================================
var selectedBulkId = undefined;
function fillSessionsTable(data) {
	$("#defaultSessionsText").attr("data-isTableShowing", "True");

	$(".anbarAddSessionsTable").remove();

	$(".sessions-table").append("<table class='anbarAddSessionsTable'></table>");
	$(".anbarAddSessionsTable").append("<thead></thead>");
	$(".anbarAddSessionsTable").append("<tbody></tbody>");

	$(".anbarAddSessionsTable > thead").append(`<th>Begin date:</th>`);
	$(".anbarAddSessionsTable > thead").append(`<th>Cost price:</th>`);
	$(".anbarAddSessionsTable > thead").append(`<th>Sum price:</th>`);
	$(".anbarAddSessionsTable > thead").append(`<th>Status:</th>`);

	data.forEach((el) => {
		let row = `<tr class="bulk-session" data-id='${el.id}'>`;

		row += `<td title="${moment(el.begin_date).format("DD MMMM YYYY, h:mm:ss")}">${moment(
			el.begin_date
		).format("DD MMMM YYYY")}</td>`;
		row += `<td>${el.cost_price}</td>`;
		row += `<td>${el.sum_price}</td>`;
		row += `<td>${el.done === "+" ? "Finished" : "Not Finished"}</td>`;

		row += "</tr>";
		$(".anbarAddSessionsTable > tbody").append(row);
	});

	// Fill empty tables
	if (data.length < 9) {
		for (let i = 0; i < 9 - data.length; i++) {
			let row = "<tr class='empty-bulk-session' style='height: 40px'>";

			for (let j = 0; j < 4; j++) {
				row += "<td></td>";
			}

			row += "</tr>";

			$(".anbarAddSessionsTable > tbody").append(row);
		}
	}

	$(".bulk-session").click(function () {
		$(".anbarAddInfo").hide();
		getSessionInfo($(this).attr("data-id"));
	});
	$(".bulk-session").contextmenu(function () {
		showSingleSessionOptions($(this));
	});
	$(".empty-bulk-session").contextmenu(function () {
		showSingleSessionOptions($(this));
	});
}
function getBulkSessions(id) {
	selectedBulkId = id;
	poolConnect.then((pool) => {
		pool
			.request()
			.input("bulk_buying_id", id)
			.execute("dbo.bulk_buying_session_selection", (err, res) => {
				if (err !== null) console.log(err);
				fillSessionsTable(res.recordset);
			});
	});
}
function refreshSessionsTable(timeout = 0) {
	setTimeout(() => {
		getBulkSessions(selectedBulkId);
	}, timeout);
}
function deleteSession(session_id) {
	poolConnect.then((pool) => {
		pool
			.request()
			.input("id", parseInt(session_id))
			.execute("dbo.bulk_buying_delete_session", (err) => {
				if (err !== null) console.log(err);
			});
	});
}
function addNewSession(begin_date) {
	poolConnect.then((pool) => {
		pool
			.request()
			.input("bulk_buying_id", selectedBulkId)
			.input("begin_date", begin_date)
			.execute("dbo.bulk_buying_create_new_session", (err) => {
				if (err != null) console.log(err);
			});
	});
}
function acceptAllInsert(bulk_id, session_id) {
	poolConnect.then((pool) => {
		pool.request
			.input("session_id", parseInt(session_id))
			.input("bulk_buying_id", parseInt(bulk_id))
			.input("user_id", USER.id)
			.execute("dbo.bulk_buying_session_info_accept_insert", (err, res) => {
				if (err !== null) console.log(err);
			});
	});
}
function showAddNewSessionForm() {
	// Preparing form
	let now = new Date();
	let day = ("0" + now.getDate()).slice(-2);
	let month = ("0" + (now.getMonth() + 1)).slice(-2);
	let today = now.getFullYear() + "-" + month + "-" + day;
	$("#addNewSessionBeginDate").val(today);

	// Showing Form
	$(".anbarAdd-container").css({
		"pointer-events": "none",
	});
	$(".addNewSessionForm").css({
		opacity: "1",
		display: "flex",
		"pointer-events": "all",
	});
	$(".addNewSessionForm").attr("data-isActive", "True");
}
function hideAddNewSessionForm() {
	$(".anbarAdd-container").css({
		"pointer-events": "all",
	});
	$(".addNewSessionForm").css({
		opacity: "0",
	});
	$(".addNewSessionForm").attr("data-isActive", "False");
	setTimeout(() => {
		$(".addNewSessionForm").css("display", "none");
	}, 600);
}
$("#addNewSessionDiscardBtn").click(() => {
	hideAddNewSessionForm();
});
$("#addNewSessionSubmitBtn").click(() => {
	addNewSession(moment($("#addNewSessionBeginDate").val()).format("yyyy-MM-DD HH:mm:ss"));
	refreshSessionsTable(600);
	hideAddNewSessionForm();
});
function showSingleSessionOptions(sessionEl) {
	if (sessionEl.attr("class") === "empty-bulk-session") {
		$(".bulk-session").attr("data-isSelected", "False");
		$(".optionsBtn").attr("data-isActive", "False");
		$("#optionsAccept").hide();
		$("#optionsDelete").hide();
		$("#optionsMenu").attr("data-belongsTo", "Sessions");
		$("#optionsMenu").css({
			top:
				currentMousePos.y -
				$(document).height() * 0.09 -
				$($(".optionsBtn")[0]).height() / 2 +
				5,
			left: currentMousePos.x - $($(".optionsBtn")[0]).height() / 2 - 15,
		});

		$("#optionsNew").attr("title", "Add new session");
		$(".optionsBtn").attr("data-isActive", "True");
		return;
	}

	$(".bulk-session").attr("data-isSelected", "False");
	$(".optionsBtn").attr("data-isActive", "False");
	$("#optionsAccept").show();
	$("#optionsDelete").show();
	$("#optionsMenu").attr("data-belongsTo", "Sessions");
	$("#optionsMenu").css({
		top:
			currentMousePos.y -
			$(document).height() * 0.09 -
			$($(".optionsBtn")[0]).height() / 2 +
			5,
		left: currentMousePos.x - $($(".optionsBtn")[0]).height() / 2 - 15,
	});
	sessionEl.attr("data-isSelected", "True");
	$("#optionsDelete").attr("data-sessionId", sessionEl.attr("data-id"));
	$("#optionsDelete").attr("title", "Delete session");
	$("#optionsAccept").attr("data-sessionId", sessionEl.attr("data-id"));
	$("#optionsNew").attr("title", "Add new session");
	$(".optionsBtn").attr("data-isActive", "True");
}
$("#optionsAccept").click(function () {
	if ($("#optionsMenu").attr("data-belongsTo") !== "Sessions") {
		return;
	}
	showAlert("Are you sure you want to accept all insert in this session?").then((res) => {
		if (res) {
			acceptAllInsert(selectedBulkId, $(this).attr("data-sessionId"));
			refreshSessionsTable(600);
		}
		closeAlert();
	});
});
$("#optionsDelete").click(function () {
	if ($("#optionsMenu").attr("data-belongsTo") !== "Sessions") {
		return;
	}
	showAlert("Are you sure you want to delete this session?").then((res) => {
		if (res) {
			deleteSession($(this).attr("data-sessionId"));
			refreshSessionsTable(600);
		}
		closeAlert();
	});
});
$("#optionsNew").click(function () {
	if ($("#optionsMenu").attr("data-belongsTo") !== "Sessions") {
		return;
	}
	showAddNewSessionForm();
});
$(document).click((el) => {
	$(".bulk-session").attr("data-isSelected", "False");
	$(".optionsBtn").attr("data-isActive", "False");

	if ($(".addNewSessionForm").attr("data-isActive") === "True") {
		if ($.inArray(el.target, $("#optionsMenu img")) != -1) {
			return;
		}
		if (
			$(el.target).attr("class") !== "addNewSessionForm" &&
			$.inArray(el.target, $(".addNewSessionForm").children()) < 0 &&
			$.inArray($(el.target).parent()[0], $(".addNewSessionForm").children()) < 0 &&
			$.inArray($(el.target).parent().parent()[0], $(".addNewSessionForm").children()) < 0
		) {
			hideAddNewSessionForm();
		}
	}
});

// ====================================================================================================
//                                       SESSIONS INFO part
// ====================================================================================================
var selectedSessionId = undefined;
function fillSessionInfoTable(data) {
	$(".anbarAddSessionInfoTable").remove();

	$(".session-info-table").append("<table class='anbarAddSessionInfoTable'></table>");
	$(".anbarAddSessionInfoTable").append("<thead></thead>");
	$(".anbarAddSessionInfoTable").append("<tbody></tbody>");

	$(".anbarAddSessionInfoTable > thead").append(`<th>Product:</th>`);
	$(".anbarAddSessionInfoTable > thead").append(`<th>Quantity:</th>`);
	$(".anbarAddSessionInfoTable > thead").append(`<th>Unit:</th>`);
	$(".anbarAddSessionInfoTable > thead").append(`<th>Price for 1:</th>`);
	$(".anbarAddSessionInfoTable > thead").append(`<th>For sale price:</th>`);
	$(".anbarAddSessionInfoTable > thead").append(`<th>Extra charge:</th>`);
	$(".anbarAddSessionInfoTable > thead").append(`<th>Sum price:</th>`);
	$(".anbarAddSessionInfoTable > thead").append(`<th>Currency:</th>`);
	$(".anbarAddSessionInfoTable > thead").append(`<th>Expriration date:</th>`);
	$(".anbarAddSessionInfoTable > thead").append(`<th>Product cell:</th>`);
	$(".anbarAddSessionInfoTable > thead").append(`<th>Reason:</th>`);

	data.forEach((el) => {
		let row = `<tr class="single-session-info" data-id='${el.id} data-cluster-id='${el.cluster_id}''>`;

		row += `<td>${el.title[0]}</td>`;
		row += `<td>${el.quantity}</td>`;
		row += `<td>${el.product_unit}</td>`;
		row += `<td>${el["price for 1"]}</td>`;
		row += `<td>${el.for_sale_price}</td>`;
		row += `<td>${el.extra_charge}</td>`;
		row += `<td>${el.sum_price}</td>`;
		row += `<td>${el.title[1]}</td>`;
		row += `<td title="${moment(el.exp_date).format("Da MMMM YYYY, h:mm:ss")}">${moment(
			el.exp_date
		).format("DD MMMM YYYY")}</td>`;
		row += `<td>${el.product_cell}</td>`;
		row += `<td>${el.reason}</td>`;

		row += "</tr>";
		$(".anbarAddSessionInfoTable > tbody").append(row);
	});

	// Fill empty tables
	if (data.length < 17) {
		for (let i = 0; i < 17 - data.length; i++) {
			let row = "<tr class='empty-single-session-info' style='height: 40px'>";

			for (let j = 0; j < 11; j++) {
				row += "<td></td>";
			}

			row += "</tr>";

			$(".anbarAddSessionInfoTable > tbody").append(row);
		}
	}

	$(".single-session-info").contextmenu(function () {
		showSingleSessionInfoOptions($(this));
	});
	$(".empty-single-session-info").contextmenu(function () {
		showSingleSessionInfoOptions($(this));
	});
}
$("#sessionInfoGoBackBtn").click(() => {
	refreshSessionsTable(600);
	hideSessionInfo();
	$(".anbarAddInfo").show();
});
function hideSessionInfo() {
	$(".session-info").attr("data-isActive", "false");
}
function showSessionInfo(data) {
	$(".session-info").attr("data-isActive", "true");
	fillSessionInfoTable(data);
}
function getSessionInfo(id) {
	selectedSessionId = id;
	poolConnect.then((pool) => {
		pool
			.request()
			.input("session_id", id)
			.execute("dbo.bulk_buying_session_info", (err, res) => {
				if (err !== null) console.log(err);
				showSessionInfo(res.recordset);
			});
	});
}
function refreshSessionInfoTable(timeout = 0) {
	setTimeout(() => {
		getSessionInfo(selectedSessionId);
	}, timeout);
}
function deleteSessionInfo(sessionInfoId) {
	poolConnect.then((pool) => {
		pool
			.request()
			.input("id", sessionInfoId)
			.execute("dbo.bulk_buying_session_info_delete", (err) => {
				if (err !== null) console.log(err);
			});
	});
}
function addNewSessionInfo() {
	let product_id = parseInt($("#addNewSessionInfo_productId").attr("data-productId"));
	let barcode = parseInt($("#addNewSessionInfo_barcode").val());
	let voen = parseInt($("#addNewSessionInfo_voen").val());
	let quantity = parseInt($("#addNewSessionInfo_quantity").val());
	let price = parseInt($("#addNewSessionInfo_price").val());
	let extra_charge = parseInt($("#addNewSessionInfo_extraCharge").val());
	let cluster_id = parseInt(
		$("#addNewSessionInfo_cluster").children("option:selected").attr("data-id")
	);
	let currency_id = parseInt(
		$("#addNewSessionInfo_currency").children("option:selected").attr("data-id")
	);
	let product_cell = parseInt($("#addNewSessionInfo_productCell").val());
	let product_manufacturer = parseInt(
		$("#addNewSessionInfo_productManufacturer")
			.children("option:selected")
			.attr("data-id")
	);
	let exp_date = moment($("#addNewSessionInfo_expDate").val()).format(
		"yyyy-MM-DD HH:mm:ss"
	);
	let reason = $("#addNewSessionInfo_reason").val();
	let session_id = parseInt(selectedSessionId);
	let bulk_id = parseInt(selectedBulkId);

	poolConnect.then((pool) => {
		pool
			.request()
			.input("product_id", product_id)
			.input("quantity", quantity)
			.input("price", price)
			.input("extra_charge", extra_charge)
			.input("cluster_id", cluster_id)
			.input("exp_date", exp_date)
			.input("reason", reason)
			.input("product_cell", product_cell)
			.input("currency", currency_id)
			.input("product_manufacturer", product_manufacturer)
			.input("barcode", barcode)
			.input("session_id", session_id)
			.input("bulk_buying_id", bulk_id)
			.input("product_voen", voen)
			.input("user_id", USER.id)
			.execute("dbo.bulk_buying_session_info_insert", (err) => {
				if (err !== null) console.log(err);
			});
	});
}
function addNewSessionInfoFormValidation() {
	let arr = $(".addNewSessionInfoForm input");
	for (let i = 0; i < arr.length; i++) {
		if ($(arr[i]).val() === "") {
			return false;
		}
	}

	let tmp_val = $("#addNewSessionInfo_productId").attr("data-productId");
	if (tmp_val === undefined || tmp_val === "") {
		return false;
	}

	return true;
}
function addNewSessinoInfoFormEmptyInputs() {
	$("#addNewSessionInfo_productId").attr("data-productId", "");
	let arr = $(".addNewSessionInfoForm input");
	for (let i = 0; i < arr.length; i++) {
		if ($(arr[i]).attr("type") !== "date") {
			$(arr[i]).val("");
		}
	}
}
async function showAddNewSessionInfoForm() {
	// Preparing form
	let now = new Date();
	let day = ("0" + now.getDate()).slice(-2);
	let month = ("0" + (now.getMonth() + 3)).slice(-2);
	let date = now.getFullYear() + "-" + month + "-" + day;
	$("#addNewSessionInfo_expDate").val(date);

	$("#addNewSessionInfo_cluster").empty();
	let clustersData = await new Promise((resolve) => {
		poolConnect.then((pool) => {
			pool.request().execute("dbo.cluster_names_select_all", (err, res) => {
				if (err !== null) console.log(err);
				resolve(res.recordset);
			});
		});
	});
	for (let i = 0; i < clustersData.length; i++) {
		$("#addNewSessionInfo_cluster").append(
			`<option data-id="${clustersData[i].id}">${clustersData[i].title}</option>`
		);
	}

	$("#addNewSessionInfo_currency").empty();
	let currencyData = await new Promise((resolve) => {
		poolConnect.then((pool) => {
			pool.request().execute("dbo.currency_select", (err, res) => {
				if (err !== null) console.log(err);
				resolve(res.recordset);
			});
		});
	});
	for (let i = 0; i < currencyData.length; i++) {
		$("#addNewSessionInfo_currency").append(
			`<option data-id="${currencyData[i].id}" title="${currencyData[i].full_title}">${currencyData[i].title}</option>`
		);
	}

	$("#addNewSessionInfo_productManufacturer").empty();
	let manufacturerData = await new Promise((resolve) => {
		poolConnect.then((pool) => {
			pool.request().execute("dbo.product_manufacturer_select_all", (err, res) => {
				if (err !== null) console.log(err);
				resolve(res.recordset);
			});
		});
	});
	for (let i = 0; i < manufacturerData.length; i++) {
		$("#addNewSessionInfo_productManufacturer").append(
			`<option data-id="${manufacturerData[i].id}">${manufacturerData[i].title}</option>`
		);
	}

	// Showing Form
	$(".anbarAdd-container").css({
		"pointer-events": "none",
	});
	$(".session-info").css({
		"pointer-events": "none",
	});
	$(".addNewSessionInfoForm").css({
		opacity: "1",
		display: "flex",
		"pointer-events": "all",
	});
	$(".addNewSessionInfoForm").attr("data-isActive", "True");
}
function hideAddNewSessionInfoForm() {
	$(".anbarAdd-container").css({
		"pointer-events": "all",
	});
	$(".session-info").css({
		"pointer-events": "all",
	});
	$(".addNewSessionInfoForm").css({
		opacity: "0",
	});
	$(".addNewSessionInfoForm").attr("data-isActive", "False");
	addNewSessinoInfoFormEmptyInputs();
	setTimeout(() => {
		$(".addNewSessionInfoForm").css("display", "none");
	}, 600);
}
$("#addNewSessionInfoDiscardBtn").click(() => {
	hideAddNewSessionInfoForm();
});
$("#addNewSessionInfoSubmitBtn").click(() => {
	if (!addNewSessionInfoFormValidation()) {
		console.log("Fill all inputs");
		return;
	}
	addNewSessionInfo(
		moment($("#addNewSessionInfoBeginDate").val()).format("yyyy-MM-DD HH:mm:ss")
	);
	refreshSessionInfoTable(600);
	hideAddNewSessionInfoForm();
});
function showSingleSessionInfoOptions(sessionInfoEl) {
	$("#optionsAccept").hide();
	if (sessionInfoEl.attr("class") === "empty-single-session-info") {
		$(".single-session-info").attr("data-isSelected", "False");
		$(".optionsBtn").attr("data-isActive", "False");
		$("#optionsDelete").hide();
		$("#optionsMenu").attr("data-belongsTo", "SessionsInfo");
		$("#optionsMenu").css({
			top:
				currentMousePos.y -
				$(document).height() * 0.09 -
				$($(".optionsBtn")[0]).height() / 2 +
				5,
			left: currentMousePos.x - $($(".optionsBtn")[0]).height() / 2 - 15,
		});

		$("#optionsNew").attr("title", "Add new product income");
		$(".optionsBtn").attr("data-isActive", "True");
		return;
	}

	$(".single-session-info").attr("data-isSelected", "False");
	$(".optionsBtn").attr("data-isActive", "False");
	$("#optionsDelete").show();
	$("#optionsMenu").attr("data-belongsTo", "SessionsInfo");
	$("#optionsMenu").css({
		top:
			currentMousePos.y -
			$(document).height() * 0.09 -
			$($(".optionsBtn")[0]).height() / 2 +
			5,
		left: currentMousePos.x - $($(".optionsBtn")[0]).height() / 2 - 15,
	});
	sessionInfoEl.attr("data-isSelected", "True");
	$("#optionsDelete").attr("data-sessionInfoId", sessionInfoEl.attr("data-id"));
	$("#optionsDelete").attr("title", "Delete product income");
	$("#optionsNew").attr("title", "Add new product income");
	$(".optionsBtn").attr("data-isActive", "True");
}
$("#optionsDelete").click(function () {
	if ($("#optionsMenu").attr("data-belongsTo") !== "SessionsInfo") {
		return;
	}
	showAlert("Are you sure you want to delete this session's product income?").then(
		(res) => {
			if (res) {
				deleteSessionInfo($(this).attr("data-sessionId"));
				refreshSessionInfoTable(600);
			}
			closeAlert();
		}
	);
});
$("#optionsNew").click(function () {
	if ($("#optionsMenu").attr("data-belongsTo") !== "SessionsInfo") {
		return;
	}
	showAddNewSessionInfoForm();
});
$(document).click((el) => {
	$(".bulk-session").attr("data-isSelected", "False");
	$(".optionsBtn").attr("data-isActive", "False");

	if ($(".addNewSessionInfoForm").attr("data-isActive") === "True") {
		if ($.inArray(el.target, $("#optionsMenu img")) !== -1) {
			return;
		}
		if ($(".anbarAddToTreeForm").attr("data-isActive") === "true") {
			if (
				el.target === $("#addNewSessionInfoDropDownAddNewproductToTreeBtn")[0] ||
				el.target === $(".anbarAddToTreeForm")[0] ||
				$.inArray(el.target, $(".anbarAddToTreeForm").children()) !== -1 ||
				$.inArray($(el.target).parent()[0], $(".anbarAddToTreeForm").children()) !== -1
			) {
				return;
			} else {
				hideAddNewProductToTreeForm();
				return;
			}
		}
		if (
			$(el.target).attr("class") !== "addNewSessionInfoForm" &&
			$.inArray(el.target, $(".addNewSessionInfoForm").children()) < 0 &&
			$.inArray($(el.target).parent()[0], $(".addNewSessionInfoForm").children()) < 0 &&
			$.inArray(
				$(el.target).parent().parent()[0],
				$(".addNewSessionInfoForm").children()
			) < 0 &&
			$.inArray(
				$(el.target).parent().parent().parent()[0],
				$(".addNewSessionInfoForm").children()
			) < 0 &&
			$.inArray(
				$(el.target).parent().parent().parent().parent()[0],
				$(".addNewSessionInfoForm").children()
			) < 0 &&
			$.inArray(
				$(el.target).parent().parent().parent().parent().parent()[0],
				$(".addNewSessionInfoForm").children()
			) < 0 &&
			$.inArray(
				$(el.target).parent().parent().parent().parent().parent().parent()[0],
				$(".addNewSessionInfoForm").children()
			) < 0
		) {
			hideAddNewSessionInfoForm();
		}
	}
});

// Search product in addNewSessionInfo
function fillAddNewSessionInfoProductDropdown(data) {
	$("#addNewSessionInfoDrowdown").empty();
	let parent = $("#addNewSessionInfoDrowdown");
	data.forEach((el) => {
		if (el.product_id !== null) {
			parent.append(
				`<p class="dropdown-member" data-barcode="${el.barcode}" data-id="${el.product_id}">${el.title}</p>`
			);
		}
	});

	$(".dropdown-member").click(function () {
		$("#addNewSessionInfo_productId").attr("data-productId", $(this).attr("data-id"));
		$("#addNewSessionInfo_productId").val($(this).html());
		$("#addNewSessionInfo_barcode").val();
		setTimeout(() => {
			$("#addNewSessionInfoDrowdown").empty();
		}, 100);
	});
}
$("#addNewSessionInfo_productId").keyup(function () {
	if ($(this).val().trim() === "") return;
	let text = $(this).val().trim();
	let textNum = parseInt(text);
	if (!Number.isNaN(textNum)) {
		poolConnect.then((pool) => {
			pool
				.request()
				.input("product_id", textNum)
				.execute("dbo.bulk_buying_session_info_search", (err, res) => {
					fillAddNewSessionInfoProductDropdown(res.recordset);
				});
		});
	} else {
		poolConnect.then((pool) => {
			pool
				.request()
				.input("title", text)
				.execute("dbo.bulk_buying_session_info_search", (err, res) => {
					fillAddNewSessionInfoProductDropdown(res.recordset);
				});
		});
	}
});

function showAddNewProductToTreeForm() {
	$(".anbarAddToTreeForm").attr("data-isActive", "true");
}
function hideAddNewProductToTreeForm() {
	$(".anbarAddToTreeForm").attr("data-isActive", "false");
}
$("#addNewSessionInfoDropDownAddNewproductToTreeBtn").click(function () {
	showAddNewProductToTreeForm();
});

// ====================================================================================================
//                                        GENERAL DATE PICKER SETUP
// ====================================================================================================
$("#date_from").change(function () {
	let date = $(this).val();
	if ($("#date_to").val() !== "") {
		getAllBulks(
			moment($("#date_from").val()).format("yyyy-MM-DD HH:mm:ss"),
			moment($("#date_to").val()).format("yyyy-MM-DD HH:mm:ss")
		);
	}
});
$("#date_to").change(function () {
	if ($("#date_from").val() !== "") {
		getAllBulks(
			moment($("#date_from").val()).format("yyyy-MM-DD HH:mm:ss"),
			moment($("#date_to").val()).format("yyyy-MM-DD HH:mm:ss")
		);
	}
});

(function presetDate() {
	var now = new Date();
	var day = ("0" + now.getDate()).slice(-2);
	var month = ("0" + now.getMonth()).slice(-2);
	var today = now.getFullYear() + "-" + month + "-" + day;
	var month2 = ("0" + (now.getMonth() + 2)).slice(-2);
	var today2 = now.getFullYear() + "-" + month2 + "-" + day;
	$("#date_from").val(today);
	$("#date_to").val(today2);
	getAllBulks(
		moment($("#date_from").val()).format("yyyy-MM-DD HH:mm:ss"),
		moment($("#date_to").val()).format("yyyy-MM-DD HH:mm:ss")
	);
})();
