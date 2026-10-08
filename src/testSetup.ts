import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
configure({ asyncUtilTimeout: 10000 });
import { afterEach, vi } from 'vitest';

// jsdom does not implement the native dialog API.
HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
afterEach(() => { cleanup(); localStorage.clear(); vi.unstubAllGlobals(); });
