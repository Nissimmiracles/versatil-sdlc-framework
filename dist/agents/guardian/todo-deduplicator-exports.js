/**
 * Exported utility functions for TODO deduplication
 * These are wrapper functions for testing
 */
/**
 * Calculate fingerprint for a TODO item
 */
export function calculateTodoFingerprint(todo) {
    const normalized = `${todo.file}:${todo.title}:${todo.description}`
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[0-9]+ms/g, 'Xms')
        .replace(/[0-9]+%/g, 'X%')
        .replace(/[0-9]+ (dependencies|files|errors)/g, 'X $1')
        .slice(0, 150)
        .trim();
    return normalized;
}
/**
 * Check if two TODOs are similar
 */
export function areTodosSimilar(todo1, todo2, threshold = 0.8) {
    const fp1 = calculateTodoFingerprint(todo1);
    const fp2 = calculateTodoFingerprint(todo2);
    if (fp1 === fp2)
        return true;
    // Calculate simple similarity
    const maxLen = Math.max(fp1.length, fp2.length);
    if (maxLen === 0)
        return true;
    let distance = 0;
    for (let i = 0; i < maxLen; i++) {
        if (fp1[i] !== fp2[i])
            distance++;
    }
    const similarity = 1 - (distance / maxLen);
    return similarity >= threshold;
}
/**
 * Deduplicate an array of TODOs
 */
export function deduplicateTodos(todos) {
    const uniqueTodos = [];
    const seenFingerprints = new Set();
    for (const todo of todos) {
        const fingerprint = calculateTodoFingerprint(todo);
        if (!seenFingerprints.has(fingerprint)) {
            uniqueTodos.push(todo);
            seenFingerprints.add(fingerprint);
        }
    }
    return uniqueTodos;
}
//# sourceMappingURL=todo-deduplicator-exports.js.map