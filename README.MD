# PDA Visualizer – Interactive Brackets & Parentheses Balancing Engine

## Project Description

The PDA Visualizer is an interactive simulation of a Pushdown Automaton (PDA) designed to recognize balanced brackets and parentheses.

The project demonstrates how a PDA uses a stack to process nested structures and determine whether an input expression is valid according to bracket-matching rules.

## Live Demo

The PDA Visualizer is deployed and accessible online.

**Live Application:** [PDA Visualizer](https://pda-visualizer.onrender.com/)

## Objectives

- Demonstrate the working of a Pushdown Automaton.
- Visualize stack operations during input processing.
- Understand the role of PUSH and POP operations in PDA transitions.
- Identify correctly balanced and mismatched brackets.
- Illustrate the acceptance and rejection of input strings.

## Supported Brackets

- Parentheses: `()`
- Square brackets: `[]`
- Curly brackets: `{}`

All other characters in the input are ignored during bracket validation.

## Key Features

- Interactive PDA simulation.
- Step-by-step execution of transitions.
- Visual representation of the stack.
- PUSH and POP operation tracking.
- Previous Step functionality.
- Run All and Pause controls.
- Real-time transition and stack information.
- Acceptance and rejection status.
- Simulation history.

## Working Principle

The automaton uses a stack with a permanent bottom-of-stack marker `Z0`.

1. **Opening bracket:** Push the symbol onto the stack.
2. **Closing bracket:** Compare it with the symbol at the top of the stack.
3. **Matching bracket:** Pop the corresponding opening bracket.
4. **Mismatched bracket:** Reject the input.
5. **End of input:** Accept if the stack contains only `Z0`; otherwise, reject.

## Technology Used

- Python
- Flask
- HTML
- CSS
- JavaScript

## Concept

This project is based on the concept of a **Pushdown Automaton**, a computational model that consists of finite control and an auxiliary stack.

The stack enables the PDA to recognize nested structures and context-free patterns such as balanced parentheses.

## Conclusion

The PDA Visualizer provides a practical demonstration of Pushdown Automata and stack-based computation. It connects the theoretical concepts studied in Theory of Computation with an interactive implementation, making PDA transitions and language recognition easier to understand.