import process from "node:process";
import {
	createPrompt,
	execCommand,
	getWorkspaceProjects,
	type WorkspaceProject,
} from "./utils.js";

const args = process.argv.slice(2);
let update = false;

if (args.length === 0) {
	update = false;
} else if (args.length === 1 && args[0] === "--update") {
	update = true;
} else {
	console.error(`usage: ${process.argv[1]} [--update]`);
	process.exit(1);
}

function getOutdatedSpecs(project: WorkspaceProject): string[] {
	const result = execCommand("pnpm", ["outdated", "--json"], {
		cwd: project.absolutePath,
		encoding: "utf8",
	});

	const rawJson = result.stdout?.toString().trim();
	if (!rawJson) return [];

	try {
		const data = JSON.parse(rawJson);
		return Object.keys(data).map((name) =>
			name === "typescript" ? "typescript@^6" : `${name}@latest`,
		);
	} catch {
		return [];
	}
}

async function main() {
	const projects = getWorkspaceProjects();
	let total = 0;
	let outdated = 0;
	let updated = 0;

	const prompt = createPrompt();

	try {
		for (const project of projects) {
			total += 1;
			console.log(`\n===== ${project.label} =====`);

			const outdatedCheck = execCommand("pnpm", ["outdated"], {
				cwd: project.absolutePath,
				stdio: "inherit",
			});

			if (outdatedCheck.status === 0) {
				console.log("(up to date)");
				continue;
			}

			if (outdatedCheck.status !== 1) {
				console.error(
					`error: pnpm outdated failed in ${project.label} (exit ${outdatedCheck.status ?? "unknown"})`,
				);
				continue;
			}

			outdated += 1;
			if (!update) continue;

			if (project.relativePath !== "." && !project.name) {
				console.error(`error: could not read package name for ${project.label}`);
				continue;
			}

			const specs = getOutdatedSpecs(project);
			if (specs.length === 0) {
				console.error(`error: could not read outdated list for ${project.label}`);
				continue;
			}

			const approved = await prompt.confirm(
				`Update in ${project.label} (${specs.join(" ")})?`,
			);

			if (!approved) {
				console.log(`skipped ${project.label}`);
				continue;
			}

			const cmdArgs =
				project.relativePath === "."
					? ["update", ...specs]
					: ["--filter", project.name, "update", ...specs];

			const updateResult = execCommand("pnpm", cmdArgs, { stdio: "inherit" });

			if (updateResult.status === 0) {
				updated += 1;
			} else {
				console.error(`error: pnpm update failed in ${project.label}`);
			}
		}
	} finally {
		prompt.close();
	}

	console.log(
		`\nSummary: outdated deps found in ${outdated} of ${total} projects (updated ${updated})`,
	);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
