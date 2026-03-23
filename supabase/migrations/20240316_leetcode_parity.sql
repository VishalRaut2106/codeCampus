-- Migration to support LeetCode Parity
ALTER TABLE problems 
ADD COLUMN IF NOT EXISTS function_name TEXT DEFAULT 'solve',
ADD COLUMN IF NOT EXISTS parameters JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS return_type TEXT DEFAULT 'any',
ADD COLUMN IF NOT EXISTS code_snippets JSONB DEFAULT '{}'::jsonb;

-- Comment for clarity
COMMENT ON COLUMN problems.function_name IS 'The name of the function to be called by the execution driver';
COMMENT ON COLUMN problems.parameters IS 'Array of {name, type} objects for the function parameters';
COMMENT ON COLUMN problems.return_type IS 'Expected return type of the function';
COMMENT ON COLUMN problems.code_snippets IS 'Map of language slugs to their respective boilerplate code';
