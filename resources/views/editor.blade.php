<x-layouts.base class="bg-neutral-50">
	<x-slot:head>
		@vite(['resources/css/editor.css'])
	</x-slot:head>

	<x-slot:postScripts>
		@vite(['resources/js/editor.ts'])
	</x-slot:postScripts>

	<div id="editor-container" class="max-w-7xl w-11/12 my-10 mx-auto">
		<div id="editor"></div>
	</div>
</x-layouts.base>
