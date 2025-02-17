import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Price {
	id: number;
	precio: number;
	fecha: string;
}

interface Item {
	id: number;
	codigo: string;
	nombre: string;
	unidad: string;
	categoria: string;
	precios: Price[];
}

// Fetch all items
async function fetchItems() {
	const response = await fetch("/api/items");
	if (!response.ok) {
		throw new Error("Network response was not ok");
	}
	return response.json();
}

// Fetch single item with prices
async function fetchItem(id: number) {
	const response = await fetch(`/api/items?id=${id}`);
	if (!response.ok) {
		throw new Error("Network response was not ok");
	}
	return response.json();
}

// Create item
async function createItem(data: Omit<Item, "id" | "precios">) {
	const response = await fetch("/api/items", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error("Network response was not ok");
	}
	return response.json();
}

// Update item
async function updateItem(data: Omit<Item, "precios">) {
	const response = await fetch("/api/items", {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error("Network response was not ok");
	}
	return response.json();
}

// Delete item
async function deleteItem(id: number) {
	const response = await fetch(`/api/items?id=${id}`, {
		method: "DELETE",
	});
	if (!response.ok) {
		throw new Error("Network response was not ok");
	}
	return response.json();
}

// Add price to item
async function addPrice(data: {
	itemId: number;
	precio: number;
	fecha: string;
}) {
	const response = await fetch("/api/items/precios", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		throw new Error("Network response was not ok");
	}
	return response.json();
}

export function useItems() {
	return useQuery<Item[]>({
		queryKey: ["items"],
		queryFn: fetchItems,
	});
}

export function useItem(id: number) {
	return useQuery<Item>({
		queryKey: ["items", id],
		queryFn: () => fetchItem(id),
		enabled: !!id,
	});
}

export function useCreateItem() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createItem,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["items"] });
		},
	});
}

export function useUpdateItem() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: updateItem,
		onSuccess: (data: Item) => {
			queryClient.invalidateQueries({ queryKey: ["items"] });
			queryClient.invalidateQueries({ queryKey: ["items", data.id] });
		},
	});
}

export function useDeleteItem() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: deleteItem,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["items"] });
		},
	});
}

export function useAddPrice() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: addPrice,
		onSuccess: (data: { itemId: number }) => {
			queryClient.invalidateQueries({ queryKey: ["items", data.itemId] });
		},
	});
}
