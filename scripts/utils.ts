import {
	spawnSync,
	type SpawnSyncOptions,
	type SpawnSyncReturns,
} from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import process from "node:process";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Workspace root directory absolute path */
export const WORKSPACE_ROOT = resolve(__dirname, "..");

export interface PackageJson {
	name?: string;
	version?: string;
	private?: boolean;
	scripts?: Record<string, string>;
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
	[key: string]: unknown;
}

export interface WorkspaceProject {
	/** Relative path from workspace root (e.g. "." or "apps/web") */
	relativePath: string;
	/** Absolute path to project directory */
	absolutePath: string;
	/** Display label for CLI outputs (e.g. "root" or "apps/web") */
	label: string;
	/** Parsed package.json */
	pkgJson: PackageJson;
	/** Package name defined in package.json */
	name: string;
}

/**
 * Executes a CLI command synchronously with default root working directory.
 */
export function execCommand(
	command: string,
	args: string[] = [],
	options: SpawnSyncOptions = {},
): SpawnSyncReturns<Buffer | string> {
	return spawnSync(command, args, {
		cwd: WORKSPACE_ROOT,
		...options,
	});
}

/**
 * Reads and parses a package.json file from a directory path.
 */
export function readPackageJson(dirPath: string): PackageJson | null {
	const pkgPath = join(dirPath, "package.json");
	if (!existsSync(pkgPath)) return null;

	try {
		const content = readFileSync(pkgPath, "utf8");
		return JSON.parse(content) as PackageJson;
	} catch {
		return null;
	}
}

/**
 * Discovers all projects containing a package.json within workspace groups.
 */
export function getWorkspaceProjects(
	groups: string[] = ["packages", "apps", "scripts"],
): WorkspaceProject[] {
	const relativeDirs: string[] = ["."];

	for (const group of groups) {
		const groupDir = join(WORKSPACE_ROOT, group);
		if (!existsSync(groupDir)) continue;

		if (existsSync(join(groupDir, "package.json"))) {
			relativeDirs.push(group);
		}

		const entries = readdirSync(groupDir, { withFileTypes: true });
		for (const entry of entries) {
			if (entry.isDirectory()) {
				relativeDirs.push(`${group}/${entry.name}`);
			}
		}
	}

	const seen = new Set<string>();
	const projects: WorkspaceProject[] = [];

	for (const rel of relativeDirs) {
		if (seen.has(rel)) continue;
		seen.add(rel);

		const abs = resolve(WORKSPACE_ROOT, rel);
		const pkgJson = readPackageJson(abs);
		if (!pkgJson) continue;

		projects.push({
			relativePath: rel,
			absolutePath: abs,
			label: rel === "." ? "root" : relative(WORKSPACE_ROOT, abs),
			pkgJson,
			name: pkgJson.name || "",
		});
	}

	return projects;
}

/**
 * Creates an interactive prompt interface.
 */
export function createPrompt() {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	return {
		async confirm(questionText: string, defaultValue = false): Promise<boolean> {
			const hint = defaultValue ? "[Y/n]" : "[y/N]";
			const answer = await rl.question(`${questionText} ${hint} `);
			const trimmed = answer.trim();

			if (!trimmed) return defaultValue;
			return /^(y|yes)$/i.test(trimmed);
		},
		close() {
			rl.close();
		},
	};
}
