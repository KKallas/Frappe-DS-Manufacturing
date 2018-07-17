# -*- coding: utf-8 -*-
# Copyright (c) 2018, digitalsputnik and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import json
import re
from frappe.model.document import Document

class ManufacturingRecipe(Document):
	def autoname(self):
		self.name = self.item

	def on_update(self):
		#insert current bom to article
		cur_doc = frappe.get_doc("Item",self.item)
		cur_doc.bom = self.name
		cur_doc.save()
		#hmm?
		frappe.db.commit()


#remove the allready exesiting items from the list
@frappe.whitelist()
def findNewItems(inputJson):
	output = []
	#loop through all the lines and find wich ones dont exists
	input = json.loads(inputJson)
	for item in input:
		#return array only with the lines that dont allready exists
		if not frappe.db.exists({"doctype":"Item", "Code":item[0]}):
			#append the fixed item to output
			output.append(item)
	return output

#create new articles based on the list
@frappe.whitelist()
def createNewItems(inputJson):
	input = json.loads(inputJson)
	for item in input:
		#if same article is 2x in the BOM do not try to create second copy
		if frappe.db.exists({"doctype":"Item", "Code":item[0]}):
			return
		#crate new article
		itemdoc = frappe.get_doc({"doctype":"Item", "code":item[0], "item":item[1], "uomtmp":item[3]})
		itemdoc.insert()
	frappe.db.commit()

#update the the comm and manuf data
@frappe.whitelist()
def updateItems(inputJson):
	input = json.loads(inputJson)
	for item in input:
		#check if comm is filled in, if so add the data
		if item[4]:
			#deal with multiple entries sepparated by comma
			subitems = item[4].split(', ')
			#get item to add the comm lines
			itemName = frappe.get_all("Item",filters={"code":item[0]})[0]['name']
			itemDoc = frappe.get_doc("Item", itemName)
			for subitem in subitems:
				itemDoc.addSource(subitem)
		#check if manuf is filled in and add the data
		if item[5]:
			#check if the line exists but is empty, if so pass this function
			if item[5].isspace():
				continue

			#get the code of the current line
			itemName = frappe.get_all("Item",filters={"code":item[0]})[0]['name']

			#check if the electronic component exists
			if frappe.db.exists("Electronic Component",itemName):
				#if yes load it up
				comp = frappe.get_doc("Electronic Component",itemName)
			else:
				#if no create it
				comp = frappe.get_doc({"doctype":"Electronic Component","code":itemName})
				comp.insert()

			#split the input first by tabs, second by semicolons
			main = re.split('\t',item[5])
			replacements = re.split(';\s*',main[2])
			#split the replacement into mnfr & MPO
			for i in range(len(replacements)):
				#skip all the replacements that start with 'any' (these are comments)
				if re.match('any.*',replacements[i]):
					replacements[i] = ['',replacements[i]]
				else:
					replacements[i] = re.split('[,\s]\s*',replacements[i])

			#make main and replacement component into single array
			replacements.insert(0,[main[0],main[1]])
			electronics = replacements

			#add line to electronic component
			for epart in electronics:
				#check if the current component is not just whitespace
				if not epart[0] == "":
					comp.addPart(epart[0],epart[1])

	frappe.db.commit()
