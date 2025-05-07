import { usePathname } from "next/navigation";

interface BreadcrumbItem {
	label: string;
	href: string;
	isCurrentPage?: boolean;
}

const routeLabels: Record<string, string> = {
	obras: "Obras",
	presupuesto: "Presupuesto",
	certificado: "Certificado",
	medicion: "Medición",
};

// Steps that should be skipped in the breadcrumb
const skipSteps = ["create"];

// Special cases where we want to combine the label with the previous step
const createLabels: Record<string, string> = {
	presupuesto: "Crear Presupuesto",
	certificado: "Crear Certificado",
	medicion: "Crear Medición",
};

export function useBreadcrumbs() {
	const pathname = usePathname();

	const generateBreadcrumbs = (): BreadcrumbItem[] => {
		// Remove trailing slash and split into segments
		const segments = pathname.replace(/\/$/, "").split("/").filter(Boolean);

		const breadcrumbs: BreadcrumbItem[] = [];
		let currentPath = "";
		let skipNext = false;

		segments.forEach((segment, index) => {
			// Skip this segment if flagged by previous iteration
			if (skipNext) {
				skipNext = false;
				return;
			}

			currentPath += `/${segment}`;

			// Check if this is a creation path
			const nextSegment = segments[index + 1];
			const isCreationPath = segment === "create" && nextSegment;

			if (isCreationPath) {
				// Skip this segment and use special creation label for next segment
				skipNext = true;
				currentPath += `/${nextSegment}`;

				breadcrumbs.push({
					label:
						createLabels[nextSegment] ||
						`Crear ${routeLabels[nextSegment] || nextSegment}`,
					href: currentPath,
					isCurrentPage: index + 1 === segments.length - 1,
				});
				return;
			}

			// Skip segments that should never appear
			if (skipSteps.includes(segment)) {
				return;
			}

			// Handle dynamic route segments (those in brackets)
			console.log("segment", segment);
			if (segment.startsWith("[") && segment.endsWith("]")) {
				// Remove brackets and make it more readable
				const dynamicSegment = segment.slice(1, -1);
				const label = `Obra : ${currentPath.split("/").pop()}`; // Use the actual path segment

				breadcrumbs.push({
					label,
					href: currentPath,
					isCurrentPage: index === segments.length - 1,
				});
			} else if (!Number.isNaN(Number(segment))) {
				breadcrumbs.push({
					label: `Obra id: ${currentPath.split("/").pop()}`,
					href: currentPath,
					isCurrentPage: index === segments.length - 1,
				});
			} else {
				breadcrumbs.push({
					label: routeLabels[segment] || segment,
					href: currentPath,
					isCurrentPage: index === segments.length - 1,
				});
			}
		});

		// Add home as first item if we have any breadcrumbs
		if (breadcrumbs.length > 0) {
			breadcrumbs.unshift({
				label: "Inicio",
				href: "/",
			});
		}

		return breadcrumbs;
	};

	return generateBreadcrumbs();
}
