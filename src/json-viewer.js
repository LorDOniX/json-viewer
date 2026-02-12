/**
 * JSONViewer - by Roman Makudera -2016- 2026 (c) MIT licence.
 */

/**
 * Create simple value (no object|array).
 *
 * @param  {Number|String|null|undefined|Date} value Input value
 * @return {Element}
 */
function createSimpleViewOf(value, isDate) {
	const spanEl = document.createElement("span");
	let type = typeof value;
	let asText = "" + value;

	if (type === "string") {
		asText = '"' + value + '"';
	} else if (value === null) {
		type = "null";
		//asText = "null";
	} else if (isDate) {
		type = "date";
		asText = value.toLocaleString();
	}

	spanEl.className = "type-" + type;
	spanEl.textContent = asText;

	return spanEl;
}

/**
 * Create items count element.
 *
 * @param  {Number} count Items count
 * @return {Element}
 */
function createItemsCount(count) {
	const itemsCount = document.createElement("span");

	itemsCount.className = "items-ph hide";
	itemsCount.innerHTML = getItemsTitle(count);

	return itemsCount;
}

/**
 * Create clickable link.
 *
 * @param  {String} title Link title
 * @return {Element}
 */
function createLink(title) {
	const linkEl = document.createElement("a");

	linkEl.classList.add("list-link");
	linkEl.href = "#";
	linkEl.addEventListener("click", event => {
		event.stopPropagation();
		event.preventDefault();
	})
	linkEl.innerHTML = title || "";

	return linkEl;
}

/**
 * Get correct item|s title for count.
 *
 * @param  {Number} count Items count
 * @return {String}
 */
function getItemsTitle(count) {
	var itemsTxt = count > 1 || count === 0 ? "items" : "item";

	return (count + " " + itemsTxt);
}

function createRootLevel(items, isArray, isCollapse) {
	// root level
	const rootCount = createItemsCount(items.length);
	// hide/show
	const rootLink = createLink(isArray ? "[" : "{");

	if (items.length) {
		rootLink.addEventListener("click", () => {
			if (isMaxLvl) {
				return;
			}

			rootLink.classList.toggle("collapsed");
			rootCount.classList.toggle("hide");

			// main list
			outputParent.querySelector("ul").classList.toggle("hide");
		});

		if (isCollapse) {
			rootLink.classList.add("collapsed");
			rootCount.classList.remove("hide");
		}
	} else {
		rootLink.classList.add("empty");
	}

	rootLink.appendChild(rootCount);

	return rootLink;
}

/**
 * Recursive walk for input value.
 *
 * @param {Element} outputParent is the Element that will contain the new DOM
 * @param {Object|Array} value Input value
 * @param {Number} maxLvl Process only to max level, where 0..n, -1 unlimited
 * @param {Number} colAt Collapse at level, where 0..n, -1 unlimited
 * @param {Number} lvl Current level
 */
function walkJSONTree(outputParent, value, maxLvl, colAt, lvl) {
	const isDate = value instanceof Date;

	if (typeof value === "object" && value !== null && !isDate) {
		const isMaxLvl = maxLvl >= 0 && lvl >= maxLvl;
		const isCollapse = colAt >= 0 && lvl >= colAt;
		const isArray = Array.isArray(value);
		const items = isArray
			? value
			: Object.keys(value);

		if (lvl === 0) {
			const rootLink = createRootLevel(items, isArray, isCollapse);

			// output the rootLink
			outputParent.appendChild(rootLink);
		}

		if (items.length && !isMaxLvl) {
			const len = items.length - 1;
			const ulList = document.createElement("ul");

			ulList.setAttribute("data-level", lvl);
			ulList.classList.add("type-" + (isArray ? "array" : "object"));

			let ind = 0;

			for (const key of items) {
				const item = isArray
					? key :
					value[key];
				const li = document.createElement("li");

				if (typeof item === "object") {
					// null && date
					if (!item || item instanceof Date) {
						li.appendChild(document.createTextNode(isArray ? "" : key + ": "));
						li.appendChild(createSimpleViewOf(item ? item : null, true));
					// array & object
					} else {
						const itemIsArray = Array.isArray(item);
						const itemLen = itemIsArray
							? item.length
							: Object.keys(item).length;

						// empty
						if (!itemLen) {
							li.appendChild(document.createTextNode(key + ": " + (itemIsArray ? "[]" : "{}")));
						} else {
							// 1+ items
							const itemTitle = (typeof key === "string" ? key + ": " : "") + (itemIsArray ? "[" : "{");
							const itemLink = createLink(itemTitle);
							const itemsCount = createItemsCount(itemLen);

							// maxLvl - only text, no link
							if (maxLvl >= 0 && lvl + 1 >= maxLvl) {
								li.appendChild(document.createTextNode(itemTitle));
							} else {
								itemLink.appendChild(itemsCount);
								li.appendChild(itemLink);
							}

							walkJSONTree(li, item, maxLvl, colAt, lvl + 1);
							li.appendChild(document.createTextNode(itemIsArray ? "]" : "}"));

							const list = li.querySelector("ul");
							const itemLinkCb = () => {
								itemLink.classList.toggle("collapsed");
								itemsCount.classList.toggle("hide");
								list.classList.toggle("hide");
							};

							// hide/show
							itemLink.addEventListener("click", itemLinkCb);

							// collapse lower level
							if (colAt >= 0 && lvl + 1 >= colAt) {
								itemLinkCb();
							}
						}
					}
				// simple values
				} else {
					// object keys with key:
					if (!isArray) {
						li.appendChild(document.createTextNode(key + ": "));
					}

					// recursive
					walkJSONTree(li, item, maxLvl, colAt, lvl + 1);
				}

				// add comma to the end
				if (ind < len) {
					li.appendChild(document.createTextNode(","));
				}

				ulList.appendChild(li);
				ind++;
			}

			// output ulList
			outputParent.appendChild(ulList);
		} else if (items.length && isMaxLvl) {
			const itemsCount = createItemsCount(items.length);

			itemsCount.classList.remove("hide");
			outputParent.appendChild(itemsCount);
		}

		if (lvl === 0) {
			// empty root
			if (!items.length) {
				var itemsCount = createItemsCount(0);
				itemsCount.classList.remove("hide");

				outputParent.appendChild(itemsCount); // output itemsCount
			}

			// root cover
			outputParent.appendChild(document.createTextNode(isArray ? "]" : "}"));

			// collapse
			if (isCollapse) {
				outputParent.querySelector("ul").classList.add("hide");
			}
		}
	} else {
		// simple values
		outputParent.appendChild( createSimpleViewOf(value, isDate) );
	}
}

class JSONViewer {
	constructor() {
		this._dom = {
			container: document.createElement("pre"),
		};
		this._dom.container.classList.add("json-viewer");
	}

	/**
	 * Visualise JSON object.
	 *
	 * @param {Object|Array} json Input value
	 * @param {Number} [inputMaxLvl] Process only to max level, where 0..n, -1 unlimited
	 * @param {Number} [inputColAt] Collapse at level, where 0..n, -1 unlimited
	 */
	showJSON(jsonValue, inputMaxLvl, inputColAt) {
		// Process only to maxLvl, where 0..n, -1 unlimited
		const maxLvl = typeof inputMaxLvl === "number"
			? inputMaxLvl
			// max level
			: -1;
		// Collapse at level colAt, where 0..n, -1 unlimited
		const colAt = typeof inputColAt === "number"
			? inputColAt
			// collapse at
			: -1;

		this._dom.container.innerHTML = "";

		walkJSONTree(this._dom.container, jsonValue, maxLvl, colAt, 0);
	}

	/**
	 * Get container with pre object - this container is used for visualise JSON data.
	 *
	 * @return {Element}
	 */
	getContainer() {
		return this._dom.container;
	}
}

// add to window
window.JSONViewer = JSONViewer;
