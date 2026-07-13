(function initContentProtection() {
	const isEditableTarget = (target) =>
		target instanceof Element &&
		Boolean(target.closest("input, textarea, select, [contenteditable='true']"));

	const style = document.createElement("style");
	style.textContent = `
body.content-protected.screenshot-guard::before{
	content:"";
	position:fixed;
	inset:0;
	z-index:99998;
	pointer-events:none;
	backdrop-filter:blur(28px);
	-webkit-backdrop-filter:blur(28px);
	background:rgba(245,247,250,.94);
	opacity:0;
	transition:opacity .12s ease;
}
body.content-protected.screenshot-guard.screen-hidden::before,
body.content-protected.screenshot-guard.capture-warning::before{
	opacity:1;
}
body.content-protected.screenshot-guard.capture-warning::after{
	content:"콘텐츠 캡처가 제한됩니다";
	position:fixed;
	left:50%;
	top:50%;
	transform:translate(-50%,-50%);
	z-index:99999;
	padding:14px 20px;
	border-radius:8px;
	background:#050B12;
	color:#fff;
	font:600 14px/1.4 "IBM Plex Sans KR","Noto Sans KR",sans-serif;
	pointer-events:none;
	box-shadow:0 12px 32px rgba(5,11,18,.28);
}
@media print{
	body.content-protected *{visibility:hidden!important}
	body.content-protected::after{
		content:"인쇄가 제한된 콘텐츠입니다.";
		visibility:visible!important;
		display:block;
		position:fixed;
		inset:0;
		padding:48px 24px;
		text-align:center;
		font:600 16px/1.6 "IBM Plex Sans KR","Noto Sans KR",sans-serif;
		color:#07121A;
		background:#F5F7FA;
	}
}
`;
	document.head.appendChild(style);

	document.body.classList.add("content-protected", "screenshot-guard");

	let captureWarningTimer = 0;

	const showCaptureWarning = () => {
		document.body.classList.add("capture-warning");
		window.clearTimeout(captureWarningTimer);
		captureWarningTimer = window.setTimeout(() => {
			document.body.classList.remove("capture-warning");
		}, 1800);
	};

	const syncScreenHidden = () => {
		const hidden = document.hidden || !document.hasFocus();
		document.body.classList.toggle("screen-hidden", hidden);
	};

	const isBlockedShortcut = (event) => {
		const key = event.key.toLowerCase();
		const commandKey = event.ctrlKey || event.metaKey;

		if (
			event.key === "PrintScreen" ||
			event.code === "PrintScreen" ||
			event.key === "Snapshot"
		) {
			return true;
		}

		if (commandKey && event.shiftKey && ["3", "4", "5", "s"].includes(key)) {
			return true;
		}

		if (
			event.key === "F12" ||
			event.key === "ContextMenu" ||
			(event.shiftKey && event.key === "F10") ||
			(commandKey && event.shiftKey && ["i", "j", "c"].includes(key)) ||
			(commandKey && ["u", "s", "p"].includes(key)) ||
			(!isEditableTarget(event.target) && commandKey && ["c", "x", "a"].includes(key))
		) {
			return true;
		}

		return false;
	};

	document.addEventListener(
		"contextmenu",
		(event) => {
			event.preventDefault();
			event.stopImmediatePropagation();
		},
		true
	);

	document.addEventListener(
		"dragstart",
		(event) => {
			if (!isEditableTarget(event.target)) event.preventDefault();
		},
		true
	);

	document.addEventListener(
		"selectstart",
		(event) => {
			if (!isEditableTarget(event.target)) event.preventDefault();
		},
		true
	);

	document.addEventListener(
		"copy",
		(event) => {
			if (!isEditableTarget(event.target)) event.preventDefault();
		},
		true
	);

	document.addEventListener(
		"cut",
		(event) => {
			if (!isEditableTarget(event.target)) event.preventDefault();
		},
		true
	);

	document.addEventListener(
		"keydown",
		(event) => {
			if (isBlockedShortcut(event)) {
				event.preventDefault();
				event.stopImmediatePropagation();
				if (
					event.key === "PrintScreen" ||
					event.code === "PrintScreen" ||
					event.key === "Snapshot" ||
					((event.metaKey || event.ctrlKey) &&
						event.shiftKey &&
						["3", "4", "5", "s"].includes(event.key.toLowerCase()))
				) {
					showCaptureWarning();
				}
			}
		},
		true
	);

	document.addEventListener("visibilitychange", syncScreenHidden);
	window.addEventListener("blur", syncScreenHidden);
	window.addEventListener("focus", syncScreenHidden);
	window.addEventListener("pagehide", () => {
		document.body.classList.add("screen-hidden");
	});
	window.addEventListener("beforeprint", (event) => {
		event.preventDefault?.();
		document.body.classList.add("screen-hidden", "capture-warning");
	});
	window.addEventListener("afterprint", () => {
		document.body.classList.remove("capture-warning");
		syncScreenHidden();
	});

	syncScreenHidden();
})();
