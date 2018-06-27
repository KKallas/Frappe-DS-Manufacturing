// Copyright (c) 2018, digitalsputnik and contributors
// For license information, please see license.txt

frappe.ui.form.on('Manufacturing Recipe', {
	//update new line count on all import fields
	import1: function(frm) {
		var count = frm.fields_dict.import1.value.split('\n').length;
		frm.fields_dict.import1.set_label("code ("+count+")");
	},
	import2: function(frm) {
		var count = frm.fields_dict.import2.value.split('\n').length;
		frm.fields_dict.import2.set_label("Name ("+count+")");
	},
	import3: function(frm) {
		var count = frm.fields_dict.import3.value.split('\n').length;
		frm.fields_dict.import3.set_label("qty ("+count+")");
	},
	import4: function(frm) {
		var count = frm.fields_dict.import4.value.split('\n').length;
		frm.fields_dict.import4.set_label("UOM ("+count+")");
	},
	import5: function(frm) {
		var count = frm.fields_dict.import5.value.split('\n').length;
		frm.fields_dict.import5.set_label("Commodity ("+count+")");
	},
	import6: function(frm) {
		var count = frm.fields_dict.import6.value.split('\n').length;
		frm.fields_dict.import6.set_label("Manuf ("+count+")");
	},
});


frappe.ui.form.on("Manufacturing Recipe", "import", function(frm) {
	//clean up name input for illegal characters and tab for electronics import
	var cleanName = $("textarea")[1].value;
	cleanName = cleanName.replace(/\t/g,' '); //slahes are for regex and g is global
	cleanName = cleanName.replace(/</g,'[lesser]');
	cleanName = cleanName.replace(/>/g,'[greater]');
	//get inputs
	var input = [$("textarea")[0].value.split('\n'),cleanName.split('\n'),$("textarea")[2].value.split('\n'),$("textarea")[3].value.split('\n'),$("textarea")[4].value.split('\n'),$("textarea")[5].value.split('\n')];
	//transpose inputs array and encode it to json
	var inputTransposed = input[0].map((col, i) => input.map(row => row[i]));
	var inputText = JSON.stringify(inputTransposed);


	//send for python side checking, confirm inserts, do inserts
	frappe.call({"method":"dsmanufacturing.manufacturing.doctype.manufacturing_recipe.manufacturing_recipe.findNewItems",
								"args":{"inputJson":inputText},
								"callback":function(r){
									if(r.message) {
										//if there are new items go create new items
										checkItems(r.message);
									} else {
										//if no new items go straight to filling the sub-table
										fillTheTable(inputTransposed);
									}
								}
							});

	//function if there are new articles to be created
	function checkItems(items) {
		//draw a table with new items from confirmation
		var list = items.map(x => "<tr><td width=100px>"+x[0]+" </td><td width=40px>"+x[3]+" </td><td>"+x[1]+"</td></tr>");
		frappe.confirm("<p>Adding items </p><table><tbody>"+list+"</tbody></table>",
			function(){createItems(items);}
		);
	};

  //create the missing articles on server side
	function createItems(items) {
		var itemsText = JSON.stringify(items);
		frappe.call({"method":"dsmanufacturing.manufacturing.doctype.manufacturing_recipe.manufacturing_recipe.createNewItems",
									"args":{"inputJson":itemsText},
									"callback": function(r){fillTheTable(items);}
			});
	};
	//add article with quantity to the recepie
	function fillTheTable(items) {
		//update the comm and manuf
		var itemsText = JSON.stringify(items);
		frappe.call({"method":"dsmanufacturing.manufacturing.doctype.manufacturing_recipe.manufacturing_recipe.updateItems",
									"args":{"inputJson":itemsText}
								});
		//clear the table and refill with new data
		cur_frm.set_value("items",[]);
		for(var i=0;i<items.length;i++) {
			var line = cur_frm.add_child("items");
			frappe.model.set_value(line.doctype,line.name, "item", "["+items[i][0]+"] "+items[i][1]);
			frappe.model.set_value(line.doctype,line.name, "qty", parseFloat(items[i][2].replace(',','.')));
		}
		cur_frm.refresh_field("items");
	};
});

frappe.ui.form.on("Manufacturing Recipe", "compare", function(frm) {
	frappe.msgprint("Compare");

	cur_frm.set_value("items",[]);

	var test = cur_frm.add_child("items");
	frappe.model.set_value(test.doctype, test.name, "qty", 0.3);
	cur_frm.refresh_field("items");
	//insert item to table
});
