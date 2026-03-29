# rwsdk Router: Method Verb Casing

## Finding
When defining method-based routes in rwsdk using `MethodHandlers`, HTTP method verbs must be **lowercase**:

```typescript
// ✅ Correct
route("/ping", { get: pingHandler })

// ❌ Incorrect (will not be recognized)
route("/ping", { GET: pingHandler })
```

## Type Definition
From `rwsdk/router`, the `MethodHandlers` type defines:

```typescript
type MethodVerb = "delete" | "get" | "head" | "patch" | "post" | "put"
```

## Impact on Error Handling
If an unregistered HTTP method is requested (e.g., POST to a route with only `get` defined), the framework automatically returns HTTP 405 Method Not Allowed.

## Reference
- `node_modules/rwsdk/dist/runtime/lib/router.d.ts` defines the method verb constants and types
