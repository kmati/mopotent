/*
 * These are the extensions to the native JavaScript Array object that are required by mopotent.
 */
Array.prototype.pushUnique = function(item) {
	for (var c = 0; c < this.length; c++) {
		if (this[c] === item)
			return;
	}
	this.push(item);
};

Array.prototype.pushRange = function(items) {
	if (items) {
		for (var i = 0; i < items.length; i++) {
			this.push(items[i]);
		}
	}
};

Array.prototype.pushRangeUnique = function(items) {
	if (items) {
		for (var i = 0; i < items.length; i++) {
			this.pushUnique(items[i]);
		}
	}
};

Array.prototype.union = function(items) {
	var arr = [];
	arr.pushRange(this);
	arr.pushRangeUnique(items);
	return arr;
};
