# Greeting Endpoint Behavioral Specs

## Overview
This document specifies the observable behavior of the greeting endpoint. All scenarios are verifiable through external HTTP interfaces only.

## Endpoint Details
- **Path**: `/greeting`
- **HTTP Method**: GET
- **Expected Response Status**: 200 OK
- **Expected Response Content-Type**: text/plain
- **Expected Response Body**: `hello world`

## Feature: Greeting Endpoint

### Scenario: User requests the greeting endpoint
```gherkin
Given the application is running
When a GET request is made to /greeting
Then the response status should be 200
And the response content-type should be text/plain
And the response body should contain "hello world"
```

### Scenario: Greeting endpoint returns consistent response
```gherkin
Given the application is running
When multiple GET requests are made to /greeting
Then each response status should be 200
And each response body should contain "hello world"
```

### Scenario: Greeting endpoint responds with exact content
```gherkin
Given the application is running
When a GET request is made to /greeting
Then the response body should be exactly "hello world"
```

## Test Implementation Notes
- Tests should use the running application's HTTP interface
- Tests should not depend on implementation details or internal state
- Each test scenario should be independently executable
- Response validation should check for exact content match and proper content-type header
