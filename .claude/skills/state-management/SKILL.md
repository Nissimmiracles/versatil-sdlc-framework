---
name: state-management
description: Modern state management patterns using Zustand (1KB lightweight), TanStack Query (server state), and Jotai (atomic state). Use when managing global state, server-state caching, or complex state logic. Reduces boilerplate by 60% vs Redux and re-renders by 80% through atomic state.
---

# State Management

## Overview

Modern React state management with minimal boilerplate using Zustand (client state), TanStack Query (server state), and Jotai (atomic state). Eliminates prop drilling, optimizes re-renders, and provides type-safe state management.

**Goal**: Efficient state management with minimal boilerplate and maximum performance

## When to Use This Skill

Use this skill when:
- Managing global client state (user preferences, UI state, cart)
- Fetching and caching server data (API responses, background sync)
- Avoiding prop drilling in deep component trees
- Optimizing re-renders (atomic state updates)
- Migrating from Redux (60% less boilerplate)
- Implementing optimistic updates
- Managing derived/computed state

**Triggers**: "state management", "global state", "Zustand", "TanStack Query", "React Query", "Jotai", "Redux migration"

---

## Quick Start: State Library Decision Tree

### When to Use Zustand vs TanStack Query vs Jotai

**Zustand** (Client state, 1KB):
- ✅ Global UI state (theme, sidebar open/closed, modal state)
- ✅ Shopping cart, user preferences
- ✅ Simple API, minimal boilerplate
- ✅ Redux-like patterns without the complexity
- ✅ Middleware (persist, devtools, immer)

**TanStack Query** (Server state, caching):
- ✅ Fetching data from APIs
- ✅ Automatic caching and background refetch
- ✅ Optimistic updates (instant UI feedback)
- ✅ Pagination, infinite scroll
- ✅ Stale-while-revalidate pattern

**Jotai** (Atomic state, granular updates):
- ✅ Fine-grained reactivity (only re-render what changed)
- ✅ Derived state (computed values)
- ✅ Async atoms (fetch data in atoms)
- ✅ Minimal re-renders (80% reduction)
- ✅ Bottom-up state management

**Use Multiple** when:
- Zustand for UI state + TanStack Query for server data (recommended combo)
- Jotai for granular state + TanStack Query for API calls

---

## Zustand Patterns

### 1. Basic Store

```typescript
import { create } from 'zustand';

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  total: number;
}

const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  addItem: (item) => set((state) => ({
    items: [...state.items, item]
  })),
  removeItem: (id) => set((state) => ({
    items: state.items.filter(item => item.id !== id)
  })),
  total: 0 // Will be computed
}));

// Usage in component
function Cart() {
  const items = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);

  return (
    <div>
      {items.map(item => <CartItem key={item.id} {...item} />)}
      <button onClick={() => addItem({ id: '1', name: 'Product' })}>
        Add Item
      </button>
    </div>
  );
}
```

### 2. Computed/Derived State

```typescript
const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  addItem: (item) => set((state) => ({
    items: [...state.items, item]
  })),
  // Computed property (getter)
  get total() {
    return get().items.reduce((sum, item) => sum + item.price, 0);
  }
}));

// Usage
function CartTotal() {
  const total = useCartStore((state) => state.total);
  return <div>Total: ${total}</div>;
}
```

### 3. Middleware (Persist, Devtools, Immer)

```typescript
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

const useStore = create<Store>()(
  devtools(
    persist(
      immer((set) => ({
        user: null,
        setUser: (user) => set((state) => {
          state.user = user; // Immer allows mutations
        })
      })),
      { name: 'user-storage' } // LocalStorage key
    )
  )
);
```

### 4. Slices Pattern (Large Stores)

```typescript
// userSlice.ts
const createUserSlice = (set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null })
});

// cartSlice.ts
const createCartSlice = (set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] }))
});

// Combined store
const useStore = create((set, get) => ({
  ...createUserSlice(set, get),
  ...createCartSlice(set, get)
}));
```

---

## TanStack Query Patterns

### 1. Basic Query (Fetch Data)

```typescript
import { useQuery } from '@tanstack/react-query';

function UserProfile({ userId }: { userId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetch(`/api/users/${userId}`).then(res => res.json()),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000    // 10 minutes (formerly cacheTime)
  });

  if (isLoading) return <Spinner />;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{data.name}</div>;
}
```

### 2. Mutations (Update Data)

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

function UpdateUserForm({ userId }: { userId: string }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (newUser: User) =>
      fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(newUser)
      }),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
    }
  });

  return (
    <button onClick={() => mutation.mutate({ name: 'New Name' })}>
      Update
    </button>
  );
}
```

### 3. Optimistic Updates

```typescript
const mutation = useMutation({
  mutationFn: updateTodo,
  onMutate: async (newTodo) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['todos'] });

    // Snapshot previous value
    const previousTodos = queryClient.getQueryData(['todos']);

    // Optimistically update
    queryClient.setQueryData(['todos'], (old: Todo[]) => [...old, newTodo]);

    // Return context with snapshot
    return { previousTodos };
  },
  onError: (err, newTodo, context) => {
    // Rollback on error
    queryClient.setQueryData(['todos'], context?.previousTodos);
  },
  onSettled: () => {
    // Refetch after error or success
    queryClient.invalidateQueries({ queryKey: ['todos'] });
  }
});
```

### 4. Pagination

```typescript
function TodoList() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['todos', page],
    queryFn: () => fetch(`/api/todos?page=${page}`).then(res => res.json()),
    placeholderData: keepPreviousData // Keep previous page while loading
  });

  return (
    <div>
      {data?.todos.map(todo => <TodoItem key={todo.id} {...todo} />)}
      <button onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</button>
      <button onClick={() => setPage(p => p + 1)}>Next</button>
    </div>
  );
}
```

### 5. Infinite Scroll

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';

function InfiniteList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['todos'],
    queryFn: ({ pageParam = 1 }) =>
      fetch(`/api/todos?page=${pageParam}`).then(res => res.json()),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) =>
      lastPage.hasMore ? pages.length + 1 : undefined
  });

  return (
    <div>
      {data?.pages.map((page, i) => (
        <React.Fragment key={i}>
          {page.todos.map(todo => <TodoItem key={todo.id} {...todo} />)}
        </React.Fragment>
      ))}
      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage ? 'Loading...' : 'Load More'}
      </button>
    </div>
  );
}
```

---

## Jotai Patterns

### 1. Primitive Atoms

```typescript
import { atom, useAtom } from 'jotai';

// Primitive atoms
const countAtom = atom(0);
const userAtom = atom<User | null>(null);

function Counter() {
  const [count, setCount] = useAtom(countAtom);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
    </div>
  );
}
```

### 2. Derived Atoms (Read-Only)

```typescript
const priceAtom = atom(10);
const quantityAtom = atom(5);

// Derived atom (computed)
const totalAtom = atom((get) => {
  const price = get(priceAtom);
  const quantity = get(quantityAtom);
  return price * quantity;
});

function Total() {
  const [total] = useAtom(totalAtom);
  return <div>Total: ${total}</div>; // Automatically updates
}
```

### 3. Async Atoms

```typescript
const userIdAtom = atom('user-123');

// Async atom (fetch data)
const userAtom = atom(async (get) => {
  const userId = get(userIdAtom);
  const response = await fetch(`/api/users/${userId}`);
  return response.json();
});

function UserProfile() {
  const [user] = useAtom(userAtom);

  return <div>{user.name}</div>; // Suspense boundary handles loading
}

// Wrap in Suspense
function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <UserProfile />
    </Suspense>
  );
}
```

### 4. Write-Only Atoms (Actions)

```typescript
const todosAtom = atom<Todo[]>([]);

// Write-only atom (action)
const addTodoAtom = atom(
  null, // No read
  (get, set, newTodo: Todo) => {
    set(todosAtom, [...get(todosAtom), newTodo]);
  }
);

function AddTodo() {
  const [, addTodo] = useAtom(addTodoAtom);

  return (
    <button onClick={() => addTodo({ id: '1', text: 'New Todo' })}>
      Add Todo
    </button>
  );
}
```

### 5. Atom Families (Dynamic Atoms)

```typescript
import { atomFamily } from 'jotai/utils';

// Create atoms dynamically based on ID
const userAtomFamily = atomFamily((userId: string) =>
  atom(async () => {
    const response = await fetch(`/api/users/${userId}`);
    return response.json();
  })
);

function UserCard({ userId }: { userId: string }) {
  const [user] = useAtom(userAtomFamily(userId));
  return <div>{user.name}</div>;
}
```

---

## Migration from Redux

### Redux to Zustand

**Before (Redux)**:
```typescript
// actions.ts
export const increment = () => ({ type: 'INCREMENT' });
export const decrement = () => ({ type: 'DECREMENT' });

// reducer.ts
const counterReducer = (state = { count: 0 }, action) => {
  switch (action.type) {
    case 'INCREMENT':
      return { count: state.count + 1 };
    case 'DECREMENT':
      return { count: state.count - 1 };
    default:
      return state;
  }
};

// store.ts
const store = createStore(counterReducer);

// Usage
dispatch(increment());
```

**After (Zustand)**:
```typescript
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 }))
}));

// Usage
const increment = useStore((state) => state.increment);
increment(); // Direct call, no dispatch
```

**60% less boilerplate** (no actions, reducers, dispatch, connect, mapStateToProps)

---

## Performance Optimization

### 1. Selector Optimization (Prevent Re-Renders)

```typescript
// ❌ Bad - Re-renders on any state change
const { items, total } = useStore();

// ✅ Good - Only re-renders when `total` changes
const total = useStore((state) => state.total);
```

### 2. Shallow Comparison

```typescript
import { shallow } from 'zustand/shallow';

// Re-renders only if items array changes (shallow comparison)
const items = useStore((state) => state.items, shallow);
```

### 3. TanStack Query - Stale Time

```typescript
// Avoid unnecessary refetches
const { data } = useQuery({
  queryKey: ['user'],
  queryFn: fetchUser,
  staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
  gcTime: 10 * 60 * 1000    // Cache for 10 minutes
});
```

---

## Resources

### scripts/
- `migration-helper.js` - Redux to Zustand migration script

### references/
- `references/zustand-patterns.md` - Store setup, middleware, slices
- `references/tanstack-query-patterns.md` - Queries, mutations, caching
- `references/jotai-patterns.md` - Atoms, derived state, async
- `references/redux-migration.md` - Step-by-step Redux → Zustand migration

### assets/
- `assets/store-templates/` - Zustand/Jotai/TanStack Query starter templates

## Related Skills

- `testing-strategies` - Testing state management with Vitest
- `performance-optimization` - Re-render optimization, profiling
- `api-design` - Backend API integration with TanStack Query
