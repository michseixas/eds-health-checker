/**
 * main.js
 *
 * Application entry point and check orchestrator.
 *
 * Responsibilities:
 *   1. Listen for URL form submission in #app-header
 *   2. Validate and normalise the input URL
 *   3. Call renderLoading() to show progress state
 *   4. Run all four checks in parallel via Promise.allSettled()
 *   5. Pass the collected CheckResult array to render() in report/dashboard.js
 *
 * @typedef {{ id: string, label: string, status: 'pass'|'warn'|'fail', findings: string[] }} CheckResult
 */

import { run as runPerformance } from './checks/performance.js';
import { run as runMetadata } from './checks/metadata.js';
import { run as runBlocks } from './checks/blocks.js';
import { run as runImages } from './checks/images.js';
import { render, renderLoading, renderError } from './report/dashboard.js';
