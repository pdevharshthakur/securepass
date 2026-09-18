<script lang="ts">
	import ShieldIcon from '@lucide/svelte/icons/shield';
	import * as Field from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { resolve } from '$app/paths';
	import { addEntry } from './add.remote';

	const id = $props.id();
</script>

<div class="flex flex-1 flex-col items-center justify-center px-6 py-12">
	<div class="flex w-full max-w-sm flex-col gap-6">
		<form
			{...addEntry.enhance(async (form) => {
				if (await form.submit()) {
					form.element.reset();
				}
			})}
		>
			<Field.FieldGroup>
				<div class="flex flex-col items-center gap-2 text-center">
					<a href={resolve('/')} class="flex flex-col items-center gap-2 font-medium">
						<div class="flex size-8 items-center justify-center rounded-md">
							<ShieldIcon class="size-6" />
						</div>
						<span class="sr-only">securepass</span>
					</a>
					<h1 class="text-xl font-bold">Add a password</h1>
					<Field.FieldDescription>Save a new login to your vault</Field.FieldDescription>
				</div>
				<Field.Field data-invalid={!!addEntry.fields.label.issues()?.length}>
					<Field.FieldLabel for="label-{id}">Label</Field.FieldLabel>
					<Input
						id="label-{id}"
						{...addEntry.fields.label.as('text')}
						placeholder="GitHub"
						required
					/>
					<Field.FieldDescription>
						A name to find this entry when searching
					</Field.FieldDescription>
					<Field.FieldError errors={addEntry.fields.label.issues()} />
				</Field.Field>
				<Field.Field data-invalid={!!addEntry.fields.username.issues()?.length}>
					<Field.FieldLabel for="username-{id}">Username or email</Field.FieldLabel>
					<Input
						id="username-{id}"
						{...addEntry.fields.username.as('text')}
						placeholder="janedoe or jane@example.com"
						required
					/>
					<Field.FieldError errors={addEntry.fields.username.issues()} />
				</Field.Field>
				<Field.Field data-invalid={!!addEntry.fields.password.issues()?.length}>
					<Field.FieldLabel for="password-{id}">Password</Field.FieldLabel>
					<Input
						id="password-{id}"
						{...addEntry.fields.password.as('password')}
						autocomplete="new-password"
						required
					/>
					<Field.FieldError errors={addEntry.fields.password.issues()} />
				</Field.Field>
				<Field.Field>
					<Button type="submit">Save password</Button>
				</Field.Field>
				{#if addEntry.result?.success}
					<Field.FieldDescription role="status">
						Password added successfully.
					</Field.FieldDescription>
				{/if}
			</Field.FieldGroup>
		</form>
	</div>
</div>
