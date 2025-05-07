import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { Node, Edge } from '@xyflow/react'
import { NodeData } from '@/store/mindmap-store'

interface WorkflowRequestBody {
  nodes: Node<NodeData>[]
  edges: Edge[]
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body: WorkflowRequestBody = await request.json()
    const { nodes, edges } = body

    // Validate the request
    if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
      return NextResponse.json(
        { error: 'Nodes array is required and cannot be empty' },
        { status: 400 },
      )
    }

    if (!edges || !Array.isArray(edges)) {
      return NextResponse.json(
        { error: 'Edges array is required' },
        { status: 400 },
      )
    }

    // Get the current user from Supabase Auth
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 },
      )
    }

    const userId = session.user.id

    // Determine the execution order (topological sort for DAG)
    const executionOrder = determineExecutionOrder(nodes, edges)

    // Execute the workflow
    const results = await executeWorkflow(executionOrder, nodes, edges, userId)

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error: any) {
    console.error('Workflow execution error:', error)
    return NextResponse.json(
      {
        error:
          error.message || 'An error occurred while executing the workflow',
      },
      { status: 500 },
    )
  }
}

// Determine the execution order using topological sort
function determineExecutionOrder(
  nodes: Node<NodeData>[],
  edges: Edge[],
): string[] {
  // Create a map of node IDs to their dependencies (incoming edges)
  const dependencies: Record<string, string[]> = {}
  const nodeIds = nodes.map((node) => node.id)

  // Initialize all nodes with empty dependency arrays
  nodeIds.forEach((id) => {
    dependencies[id] = []
  })

  // Populate dependencies based on edges
  edges.forEach((edge) => {
    if (dependencies[edge.target]) {
      dependencies[edge.target].push(edge.source)
    }
  })

  // Find starting nodes (nodes with no dependencies)
  const startingNodes = nodeIds.filter((id) => dependencies[id].length === 0)

  // Perform topological sort
  const visited = new Set<string>()
  const executionOrder: string[] = []

  function visit(nodeId: string) {
    if (visited.has(nodeId)) return

    visited.add(nodeId)

    // Find all nodes that depend on this node
    const dependents = nodeIds.filter((id) => dependencies[id].includes(nodeId))

    // Visit all dependents
    dependents.forEach((dependent) => visit(dependent))

    // Add this node to the execution order
    executionOrder.push(nodeId)
  }

  // Start with nodes that have no dependencies
  startingNodes.forEach((nodeId) => visit(nodeId))

  // If not all nodes were visited, there might be a cycle
  if (visited.size !== nodeIds.length) {
    const unvisited = nodeIds.filter((id) => !visited.has(id))

    // Visit remaining nodes (this might not produce an optimal order for cyclic graphs)
    unvisited.forEach((nodeId) => {
      if (!visited.has(nodeId)) {
        visit(nodeId)
      }
    })
  }

  // Reverse the order to get the correct execution sequence
  return executionOrder.reverse()
}

// Execute the workflow based on the determined order
async function executeWorkflow(
  executionOrder: string[],
  nodes: Node<NodeData>[],
  edges: Edge[],
  userId: string,
): Promise<Record<string, any>> {
  const results: Record<string, any> = {}
  const nodeMap = new Map(nodes.map((node) => [node.id, node]))

  // Helper function to get node inputs
  function getNodeInputs(nodeId: string): string {
    // Find all incoming edges to this node
    const incomingEdges = edges.filter((edge) => edge.target === nodeId)

    if (incomingEdges.length === 0) {
      // If no incoming edges, use the node's prompt as is
      const node = nodeMap.get(nodeId)
      return node?.data?.prompt || ''
    }

    // Combine inputs from parent nodes
    let combinedInput = ''

    incomingEdges.forEach((edge) => {
      const sourceNodeId = edge.source
      const sourceNode = nodeMap.get(sourceNodeId)
      const sourceOutput = results[sourceNodeId]?.output || ''

      // Get the prompt from the current node
      const currentNode = nodeMap.get(nodeId)
      let nodePrompt = currentNode?.data?.prompt || ''

      // Replace {input} placeholder with the output from the source node
      nodePrompt = nodePrompt.replace('{input}', sourceOutput)

      combinedInput += nodePrompt + '\n'
    })

    return combinedInput.trim()
  }

  // Execute each node in order
  for (const nodeId of executionOrder) {
    const node = nodeMap.get(nodeId)
    if (!node) continue

    try {
      // Update node status to running
      results[nodeId] = { status: 'running' }

      // Get the input for this node
      const input = getNodeInputs(nodeId)

      // Skip execution if no input or provider
      if (!input || !node.data?.provider) {
        results[nodeId] = {
          status: 'completed',
          output: 'No input or provider specified',
        }
        continue
      }

      // Call the LLM API
      const response = await fetch(`/api/llm/${node.data.provider}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: input,
          model: node.data.model,
          options: {},
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to call LLM API')
      }

      const data = await response.json()

      // Update results with the LLM response
      results[nodeId] = {
        status: 'completed',
        output: data.text,
        input,
      }
    } catch (error: any) {
      // Update results with error status
      results[nodeId] = {
        status: 'error',
        error: error.message || 'An error occurred during execution',
        input: getNodeInputs(nodeId),
      }
    }
  }

  return results
}
