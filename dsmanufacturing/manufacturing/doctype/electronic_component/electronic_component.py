# -*- coding: utf-8 -*-
# Copyright (c) 2018, digitalsputnik and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.model.document import Document

class ElectronicComponent(Document):
	def addPart(self, manuf, partnr):
		#if part allready exists do nothing
		for part in self.parts:
			if manuf in part.manuf:
				if partnr in part.mpt:
					return
		#part does not exists create a new line into self
		new_line = self.append("parts",{"manuf":manuf,"mpt":partnr})
		new_line.save()
