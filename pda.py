
class PushdownAutomaton:

    def __init__(self):

        # Opening bracket and its corresponding closing bracket
        self.opening_brackets = {
            '(': ')',
            '{': '}',
            '[': ']'
        }

        # Closing bracket and its corresponding opening bracket
        self.closing_brackets = {
            ')': '(',
            '}': '{',
            ']': '['
        }

        # Initial bottom-of-stack marker
        self.initial_stack_symbol = 'Z0'

    def simulate(self, expression):

        # Initialize PDA
        stack = [self.initial_stack_symbol]
        state = 'q0'
        steps = []

        # Process input character by character
        for index, char in enumerate(expression):

            previous_stack = stack.copy()

            action = 'IGNORE'
            message = ''

            state = 'q1'

            # Case 1: Opening bracket - PUSH
            if char in self.opening_brackets:

                stack.append(char)

                action = 'PUSH'
                message = f"Pushed '{char}' onto the stack."

            # Case 2: Closing bracket - POP
            elif char in self.closing_brackets:

                expected_opening = self.closing_brackets[char]

                # Check whether the stack top matches
                if len(stack) > 1 and stack[-1] == expected_opening:

                    stack.pop()

                    action = 'POP'
                    message = (
                        f"Matched '{char}'. "
                        f"Popped '{expected_opening}'."
                    )

                else:

                    state = 'q_reject'

                    expected_closing = (
                        self.opening_brackets.get(stack[-1])
                        if len(stack) > 1
                        else None
                    )

                    if expected_closing is None:
                        message = (
                            f"Unexpected closing bracket '{char}'. "
                            "No matching opening bracket exists."
                        )
                    else:
                        message = (
                            f"Mismatched closing bracket '{char}'. "
                            f"Expected '{expected_closing}'."
                        )

                    # Record rejection step
                    steps.append({

                        'step': index + 1,
                        'character': char,
                        'state': state,
                        'action': 'REJECT',
                        'stack_before': previous_stack,
                        'stack_after': stack.copy(),
                        'message': message

                    })

                    return {

                        'expression': expression,
                        'result': 'REJECTED',
                        'final_state': state,
                        'final_stack': stack.copy(),
                        'message': message,
                        'steps': steps

                    }

            # Case 3: Ordinary character - IGNORE
            else:

                message = f"Ignored character '{char}'."

            # Record each successful transition
            steps.append({

                'step': index + 1,
                'character': char,
                'state': state,
                'action': action,
                'stack_before': previous_stack,
                'stack_after': stack.copy(),
                'message': message

            })

        # Final stack verification
        if stack == [self.initial_stack_symbol]:

            state = 'q_accept'
            result = 'ACCEPTED'

            message = (
                "All brackets are correctly balanced."
            )

        else:

            state = 'q_reject'
            result = 'REJECTED'

            message = (
                "Unmatched opening brackets remain in the stack."
            )

        return {

            'expression': expression,
            'result': result,
            'final_state': state,
            'final_stack': stack.copy(),
            'message': message,
            'steps': steps

        }


# Main program
if __name__ == "__main__":

    pda = PushdownAutomaton()

    # Change this expression to test different cases
    test_expression = "abc"

    output = pda.simulate(test_expression)

    print("\nPDA SIMULATION")
    print("=" * 55)

    print("Expression:", output['expression'])
    print("Result:", output['result'])
    print("Final State:", output['final_state'])

    print("\nEXECUTION HISTORY")
    print("=" * 55)

    for step in output['steps']:

        print(
            f"Step {step['step']} | "
            f"Character: {step['character']} | "
            f"Action: {step['action']} | "
            f"Stack: {step['stack_after']} | "
            f"State: {step['state']}"
        )

    print("\nFinal Stack:", output['final_stack'])
    print("Final Message:", output['message'])
