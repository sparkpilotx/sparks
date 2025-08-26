#!/bin/bash

set -euo pipefail

# Function to perform calculations
calculate() {
    local operation="$1"
    local num1="$2"
    local num2="$3"
    local result
    
    case "$operation" in
        "add")
            result=$(echo "$num1 + $num2" | bc -l)
            ;;
        "subtract")
            result=$(echo "$num1 - $num2" | bc -l)
            ;;
        "multiply")
            result=$(echo "$num1 * $num2" | bc -l)
            ;;
        "divide")
            if [ "$num2" = "0" ] || [ "$num2" = "0.0" ]; then
                echo '{"error": "Cannot divide by zero"}'
                exit 1
            fi
            result=$(echo "scale=10; $num1 / $num2" | bc -l)
            ;;
        *)
            echo "{\"error\": \"Unknown operation: $operation\"}"
            exit 1
            ;;
    esac
    
    # Remove trailing zeros from result
    result=$(echo "$result" | sed 's/\.0*$//; s/\(.*\.\)0*$/\1/; s/\.$//;')
    
    echo "{\"result\": $result}"
}

# Main function
main() {
    # Read JSON input from stdin
    input_json=$(cat)
    
    # Check if jq is available for JSON parsing
    if ! command -v jq >/dev/null 2>&1; then
        echo '{"error": "jq is required for JSON parsing but not found"}'
        exit 1
    fi
    
    # Check if bc is available for calculations
    if ! command -v bc >/dev/null 2>&1; then
        echo '{"error": "bc is required for calculations but not found"}'
        exit 1
    fi
    
    # Extract arguments using jq
    operation=$(echo "$input_json" | jq -r '.operation')
    num1=$(echo "$input_json" | jq -r '.num1')
    num2=$(echo "$input_json" | jq -r '.num2')
    
    # Validate extracted values
    if [ "$operation" = "null" ] || [ "$num1" = "null" ] || [ "$num2" = "null" ]; then
        echo '{"error": "Missing required parameters: operation, num1, num2"}'
        exit 1
    fi
    
    # Perform calculation
    calculate "$operation" "$num1" "$num2"
}

# Run main function
main