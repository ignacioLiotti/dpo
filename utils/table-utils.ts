import { Item } from "../types/table-types";
import React, { createElement } from "react";

export const flattenData = (data: Item[]): Item[] => {
	return data.reduce((acc: Item[], item) => {
		acc.push(item);
		if (item.subItems) {
			acc.push(...flattenData(item.subItems));
		}
		return acc;
	}, []);
};

export const highlightText = (text: string, highlight: string) => {
	if (!highlight.trim()) {
		return text;
	}
	const regex = new RegExp(`(${highlight})`, "gi");
	return text
		.split(regex)
		.map((part, i) =>
			regex.test(part)
				? createElement("mark", { key: i, className: "bg-yellow-200" }, part)
				: part
		);
};

export const sortData = (
	data: Item[],
	sortColumn: keyof Item,
	sortDirection: "asc" | "desc"
): Item[] => {
	const sortedData = [...data].sort((a, b) => {
		const aVal = a[sortColumn];
		const bVal = b[sortColumn];
		if (aVal === undefined || bVal === undefined) return 0;
		if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
		if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
		return 0;
	});

	return sortedData.map((item) => {
		if (item.subItems) {
			return {
				...item,
				subItems: sortData(item.subItems, sortColumn, sortDirection),
			};
		}
		return item;
	});
};
