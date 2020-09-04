// =====================================================================================
//                                Anbar Overall Info part
// =====================================================================================

// Function to show Overall info
function showOverallInfo() {
	try {
		new Promise((resolve) => {
			poolConnect.then((pool) => {
				pool.request().execute("anbar.dashboard", (err, res) => {
					if (err != null) console.log(err);
					console.log(res);
					resolve(res.recordset[0]);
				});
			});
		}).then((data) => {
			$("#products_quantity").html(data.quantity);
			$("#products_remaining").html(data.remaining_products);
			$("#anbar_total_cost").html(data.cost);

			$("#add_product_name").html(data.last_in_name);
			$("#add_product_date").html(
				moment(data.last_in_date).format("MMMM Do YYYY, h:mm:ss")
			);
			$("#add_product_price").html(data.last_in_price);
			$("#add_product_quantity").html(data.last_in_quantity);
			$("#add_product_total_price").html(data.last_in_price_total);
			$("#add_product_currency").html(data.last_in_currency);

			$("#rm_product_name").html(data.last_out_name);
			$("#rm_product_date").html(
				moment(data.last_out_date).format("MMMM Do YYYY, h:mm:ss")
			);
			$("#rm_product_price").html(data.last_out_price);
			$("#rm_product_quantity").html(data.last_out_quantity);
			$("#rm_product_total_price").html(data.last_out_price_total);
			$("#rm_product_currency").html(data.last_out_currency);

			// Show box after loading content
			$("#showOverallInfo").attr("data-isClicked", "true");
			$(".overall-info").attr("data-isShoving", "true");
		});
	} catch (error) {
		console.log(error);
	}
}
// Function to hide Overall info
function hideOverallInfo() {
	$("#showOverallInfo").attr("data-isClicked", "false");
	$(".overall-info").attr("data-isShoving", "false");
}
// Handle onclick showOverallInfo
$("#showOverallInfo").click(function () {
	if ($(this).attr("data-isClicked") == "true") {
		hideOverallInfo();
	} else {
		showOverallInfo();
	}
});

// =====================================================================================
//                                   TreeView part
// =====================================================================================

// Function to feel Tree
function feelTree(data) {
	treeView = new MyTreeView(data);
	treeView.showTree("treeViewContainer");

	// Set const width to tree width not change while closing dropdown
	$(".treeViewContainer").css("width", $(".treeViewContainer").width());

	// Handling clicks
	$(".tv-groupname").click(function () {
		let ul = $($(this).parent().parent().children()[1]);
		let span = $($(this).parent().parent().children()[0]);
		if (
			ul.attr("data-isExpanded") === "true" &&
			span.attr("data-isExpanded") === "true"
		) {
			ul.attr("data-isExpanded", "false");
			span.attr("data-isExpanded", "false");
		} else {
			ul.attr("data-isExpanded", "true");
			span.attr("data-isExpanded", "true");
		}
	});

	$(".tv-name").click(function () {
		$(".tv-name").attr("data-isSelected", "false");
		$(this).attr("data-isSelected", "true");

		showProductInfo(treeView.giveDataOfElement($(this)));
	});
}

$("#expandTreeView").click(function () {
	$(this).attr("data-isClicked", "true");
	setTimeout(function () {
		$("#expandTreeView").attr("data-isClicked", "false");
	}, 600);

	let arr = $(".treeView  span");
	let arr2 = $(".treeView  ul");
	for (let i = 0; i < arr.length; i++) {
		$(arr[i]).attr("data-isexpanded", "true");
		$(arr2[i]).attr("data-isexpanded", "true");
	}
});
$("#closeTreeView").click(function () {
	$(this).attr("data-isClicked", "true");
	setTimeout(function () {
		$("#closeTreeView").attr("data-isClicked", "false");
	}, 600);

	let arr = $(".treeView  span");
	let arr2 = $(".treeView  ul");
	for (let i = 1; i < arr.length; i++) {
		$(arr[i]).attr("data-isexpanded", "false");
		$(arr2[i]).attr("data-isexpanded", "false");
	}
});

// Handle onclick hideShowTreeView
$("#hideShowTreeView").click(function () {
	if ($(this).attr("data-isClicked") == "true") {
		$(this).attr("data-isClicked", "false");
		$(".treeViewContainer").css("display", "block");
	} else {
		$(this).attr("data-isClicked", "true");
		$(".treeViewContainer").css("display", "none");
	}
});

// =====================================================================================
//                                   Search box part
// =====================================================================================

// Search box part
$("#clearSearchBox").click(() => {
	poolConnect.then((pool) => {
		pool.request().execute("anbar.warehouse_tree_select", (err, res) => {
			$("#searchInputBox").val("");
			feelTree(res.recordset);
		});
	});
});
$("#searchInputBox").keyup(function () {
	if ($(this).val().trim() === "") return;
	poolConnect.then((pool) => {
		pool
			.request()
			.input("title", mssql.NVarChar(250), $(this).val())
			.execute("anbar.warehouse_tree_search", (err, res) => {
				feelTree(res.recordset);
			});
	});
});
$("#searchInputBox").focusout(function () {
	if ($(this).val().trim() === "") $(this).val("");
	if ($(this).val() === "") {
		poolConnect.then((pool) => {
			pool.request().execute("anbar.warehouse_tree_select", (err, res) => {
				feelTree(res.recordset);
			});
		});
	}
});

// =====================================================================================
//                                SingleProductInfo part
// =====================================================================================

function fillSingleProductTable(data) {
	$(".singleProductTable").remove();

	$(".table-data").append("<table class='singleProductTable'></table>");
	$(".singleProductTable").append("<thead></thead>");
	$(".singleProductTable").append("<tbody></tbody>");

	$(".singleProductTable > thead").append(
		`<th>${languages["product_name"]}:</th>`
	);
	$(".singleProductTable > thead").append(`<th>${languages["quantity"]}:</th>`);
	$(".singleProductTable > thead").append(`<th>${languages["unit"]}:</th>`);
	$(".singleProductTable > thead").append(
		`<th>${languages["unit_price"]}:</th>`
	);
	$(".singleProductTable > thead").append(
		`<th>${languages["total_price"]}:</th>`
	);
	$(".singleProductTable > thead").append(`<th>${languages["currency"]}:</th>`);
	// $(".singleProductTable > thead").append(`<th>Original price:</th>`);
	// $(".singleProductTable > thead").append(`<th>Original currency:</th>`);
	// $(".singleProductTable > thead").append(`<th>Current date:</th>`);
	$(".singleProductTable > thead").append(`<th>${languages["exp_date"]}</th>`);
	$(".singleProductTable > thead").append(`<th>${languages["action"]}</th>`);
	$(".singleProductTable > thead").append(
		`<th>${languages["confirmed"]}:</th>`
	);
	$(".singleProductTable > thead").append(
		`<th>${languages["product_cell"]}:</th>`
	);

	data.forEach((el) => {
		let row = "<tr>";

		row += `<td>${el.title}</td>`;
		row += `<td>${el.quantity}</td>`;
		row += `<td>${el.unit_title}</td>`;
		row += `<td>${el.unit_price}</td>`;
		row += `<td>${el.total_price}</td>`;
		row += `<td>${el.currency}</td>`;
		// row += `<td>${el.original_price}</td>`;
		// row += `<td>${el.original_currency}</td>`;
		row += `<td title="${moment(el.exp_date).format(
			"Da MMMM YYYY, h:mm:ss"
		)}">${moment(el.exp_date).format("Da MMMM YYYY")}</td>`;
		row += `<td>${el.is_out ? "Removed" : "Added"}</td>`;
		row += `<td>${el.performed_by}</td>`;
		row += `<td>${el.product_cell}</td>`;

		row += "</tr>";
		$(".singleProductTable > tbody").append(row);
	});

	// Fill empty tables
	if (data.length < 5) {
		for (let i = 0; i < 10 - data.length; i++) {
			let row = "<tr style='height: 40px'>";

			for (let j = 0; j < 10; j++) {
				row += "<td></td>";
			}

			row += "</tr>";

			$(".singleProductTable > tbody").append(row);
		}
	}
}

async function showProductInfo(productData) {
	// Check if already opened
	if ($("#singleProductId").html() == productData.product_id) {
		$("#singleProductId").html("");
		$(".singleProductInfo").css("opacity", "0");
		$(".singleProductInfo").css("pointer-events", "unset");

		let tmp = $(".treeView .tv-name");
		for (let i = 0; i < tmp.length; i++) {
			$(tmp[i]).attr("data-isselected", "false");
		}
		return;
	}

	$("#singleProductName").html(productData.title);
	$("#singleProductId").html(productData.product_id);

	let table_product = await new Promise((resolve, reject) => {
		poolConnect.then((pool) => {
			pool
				.request()
				.input("product_id", productData.product_id)
				.execute("anbar.main_tree_click_table", (err, res) => {
					if (err !== null) console.log(err);
					resolve(res.recordset);
				});
		});
	});

	let data = [];
	table_product.forEach((el) => {
		data.push(el);
	});

	fillSingleProductTable(data);
	$(".singleProductInfo").css("opacity", "1");
	$(".singleProductInfo").css("pointer-events", "unset");
}

// =====================================================================================
//                                On start functions
// =====================================================================================

// Load treeView from start
poolConnect.then((pool) => {
	pool.request().execute("anbar.warehouse_tree_select", (err, res) => {
		feelTree(res.recordset);
	});
});

// Set const width
$(".smallNav").css("height", $(".searchContainer").height());
