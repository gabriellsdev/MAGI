# MAGI — V1 Requirements

## Objective

Build a multi-agent AI deliberation system inspired by the MAGI
supercomputers from Neon Genesis Evangelion.

The system should allow a user to submit a question and receive
independent analyses from three AI agents before a final MAGI
Core synthesis.

## V1 Agents

### MELCHIOR
Role: Analytical reasoning

Focus:
- Logic
- Facts
- Technical feasibility
- Evidence
- Consistency

### BALTHASAR
Role: Critical reasoning

Focus:
- Assumptions
- Risks
- Weaknesses
- Edge cases
- Counterarguments

### CASPER
Role: Alternative reasoning

Focus:
- Alternative solutions
- Different interpretations
- Practical considerations
- Simplification

## Deliberation

Agents initially analyze the question independently.

If significant disagreement exists, the agents enter a deliberation
phase.

Maximum deliberation rounds in V1: 2.

## MAGI Core

MAGI Core receives:

- Original question
- Three independent analyses
- Deliberation results

It produces the final synthesis.

MAGI Core must not simply select the majority opinion.

It should evaluate the strength of the arguments.

## V1 Constraints

- TypeScript
- Node.js
- Gemini API as the first provider
- Provider abstraction must allow future providers
- No database initially
- No authentication
- No autonomous coding
- No web search
- No RAG
- No long-term memory

## V1 Goal

A complete question → analysis → deliberation → synthesis pipeline
that can be executed reliably and tested.