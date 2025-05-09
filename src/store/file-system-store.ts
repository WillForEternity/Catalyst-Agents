import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { Edge, Node } from '@xyflow/react'
import { NodeData } from './mindmap-store'
import { createClient } from '@supabase/supabase-js'

// Define the mindmap file structure
export interface MindMapFile {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  nodes: Node<NodeData>[]
  edges: Edge[]
}

// Define folder structure
export interface Folder {
  id: string
  name: string
  files: MindMapFile[]
  subfolders: Folder[]
  isOpen?: boolean
}

// Define the file system state
export interface FileSystemState {
  folders: Folder[]
  activeMindMapId: string | null
  isFileExplorerOpen: boolean

  // Actions
  createFolder: (name: string) => void
  createMindMap: (folderId: string, name: string) => Promise<string>
  deleteMindMap: (folderId: string, fileId: string) => Promise<void>
  deleteFolder: (folderId: string) => Promise<void>
  renameMindMap: (
    folderId: string,
    fileId: string,
    newName: string,
  ) => Promise<void>
  renameFolder: (folderId: string, newName: string) => Promise<void>
  setActiveMindMap: (fileId: string) => Promise<void>
  toggleFolder: (folderId: string) => void
  toggleFileExplorer: () => void
  saveMindMap: (
    fileId: string,
    nodes: Node<NodeData>[],
    edges: Edge[],
  ) => Promise<void>
  loadMindMaps: () => Promise<void>
}

// Helper function to find a folder by ID
const findFolder = (folders: Folder[], folderId: string): Folder | null => {
  for (const folder of folders) {
    if (folder.id === folderId) {
      return folder
    }

    const subfolder = findFolder(folder.subfolders, folderId)
    if (subfolder) {
      return subfolder
    }
  }

  return null
}

// Create the Zustand store with persistence
export const useFileSystemStore = create<FileSystemState>()(
  persist(
    (set, get) => ({
      // Initialize with a default folder for mindmaps
      folders: [
        {
          id: 'default',
          name: 'My Mindmaps',
          files: [],
          subfolders: [],
          isOpen: true,
        },
      ],
      activeMindMapId: null,
      isFileExplorerOpen: true,

      createFolder: (name: string) => {
        const newFolder: Folder = {
          id: crypto.randomUUID(),
          name,
          files: [],
          subfolders: [],
          isOpen: true,
        }

        set((state) => ({
          folders: [...state.folders, newFolder],
        }))
      },

      createMindMap: async (folderId: string, name: string) => {
        const newFile: MindMapFile = {
          id: crypto.randomUUID(),
          name,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          nodes: [],
          edges: [],
        }

        const folder = findFolder(get().folders, folderId)
        if (!folder) return newFile.id

        folder.files = [...folder.files, newFile]

        set((state) => ({
          folders: [...state.folders],
          activeMindMapId: newFile.id,
        }))

        // Save to Supabase
        try {
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          )

          await supabase.from('mindmaps').insert({
            id: newFile.id,
            name: newFile.name,
            folder_id: folderId,
            nodes: newFile.nodes,
            edges: newFile.edges,
          })
        } catch (error) {
          console.error('Failed to save mindmap to Supabase:', error)
        }

        return newFile.id
      },

      deleteMindMap: async (folderId: string, fileId: string) => {
        const folder = findFolder(get().folders, folderId)
        if (!folder) return

        folder.files = folder.files.filter((file) => file.id !== fileId)

        set((state) => ({
          folders: [...state.folders],
          activeMindMapId:
            state.activeMindMapId === fileId ? null : state.activeMindMapId,
        }))

        // Delete from Supabase
        try {
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          )

          await supabase.from('mindmaps').delete().eq('id', fileId)
        } catch (error) {
          console.error('Failed to delete mindmap from Supabase:', error)
        }
      },

      deleteFolder: async (folderId: string) => {
        set((state) => ({
          folders: state.folders.filter((folder) => folder.id !== folderId),
        }))

        // Delete folder and all its mindmaps from Supabase
        try {
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          )

          await supabase.from('mindmaps').delete().eq('folder_id', folderId)
        } catch (error) {
          console.error('Failed to delete folder from Supabase:', error)
        }
      },

      renameMindMap: async (
        folderId: string,
        fileId: string,
        newName: string,
      ) => {
        const folder = findFolder(get().folders, folderId)
        if (!folder) return

        const file = folder.files.find((file) => file.id === fileId)
        if (!file) return

        file.name = newName
        file.updatedAt = new Date().toISOString()

        set((state) => ({
          folders: [...state.folders],
        }))

        // Update in Supabase
        try {
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          )

          await supabase
            .from('mindmaps')
            .update({
              name: newName,
              updated_at: file.updatedAt,
            })
            .eq('id', fileId)
        } catch (error) {
          console.error('Failed to rename mindmap in Supabase:', error)
        }
      },

      renameFolder: async (folderId: string, newName: string) => {
        const folder = findFolder(get().folders, folderId)
        if (!folder) return

        folder.name = newName

        set((state) => ({
          folders: [...state.folders],
        }))
      },

      setActiveMindMap: async (fileId: string) => {
        set({ activeMindMapId: fileId })

        // Find the mindmap in the folders
        let activeMindMap: MindMapFile | null = null

        for (const folder of get().folders) {
          const file = folder.files.find((file) => file.id === fileId)
          if (file) {
            activeMindMap = file
            break
          }
        }

        if (!activeMindMap) {
          // Try to load from Supabase
          try {
            const supabase = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL || '',
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            )

            const { data } = await supabase
              .from('mindmaps')
              .select('*')
              .eq('id', fileId)
              .single()

            if (data) {
              activeMindMap = {
                id: data.id,
                name: data.name,
                createdAt: data.created_at,
                updatedAt: data.updated_at,
                nodes: data.nodes,
                edges: data.edges,
              }
            }
          } catch (error) {
            console.error('Failed to load mindmap from Supabase:', error)
          }
        }
      },

      toggleFolder: (folderId: string) => {
        const folder = findFolder(get().folders, folderId)
        if (!folder) return

        folder.isOpen = !folder.isOpen

        set((state) => ({
          folders: [...state.folders],
        }))
      },

      toggleFileExplorer: () => {
        set((state) => ({
          isFileExplorerOpen: !state.isFileExplorerOpen,
        }))
      },

      saveMindMap: async (
        fileId: string,
        nodes: Node<NodeData>[],
        edges: Edge[],
      ) => {
        // Find the mindmap in the folders
        let mindMapFound = false

        for (const folder of get().folders) {
          const fileIndex = folder.files.findIndex((file) => file.id === fileId)
          if (fileIndex !== -1) {
            folder.files[fileIndex].nodes = nodes
            folder.files[fileIndex].edges = edges
            folder.files[fileIndex].updatedAt = new Date().toISOString()
            mindMapFound = true
            break
          }
        }

        if (mindMapFound) {
          set((state) => ({
            folders: [...state.folders],
          }))
        }

        // Save to Supabase
        try {
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          )

          await supabase
            .from('mindmaps')
            .update({
              nodes,
              edges,
              updated_at: new Date().toISOString(),
            })
            .eq('id', fileId)
        } catch (error) {
          console.error('Failed to save mindmap to Supabase:', error)
        }
      },

      loadMindMaps: async () => {
        try {
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          )

          const { data: mindmapsData, error } = await supabase
            .from('mindmaps')
            .select('*')

          if (error) throw error
          const currentFolders = get().folders

          if (!mindmapsData || mindmapsData.length === 0) {
            // Preserve local state if there are persisted files
            if (currentFolders.some((folder) => folder.files.length > 0)) {
              return
            }
            // No maps on server: initialize default folder
            set({
              folders: [
                {
                  id: 'default',
                  name: 'My Mindmaps',
                  files: [],
                  subfolders: [],
                  isOpen: true,
                },
              ],
              activeMindMapId: null,
            })
            return
          }

          // Group mindmaps by folder
          const folderMap: Record<string, Folder> = {}

          mindmapsData.forEach((mindmap) => {
            const folderId = mindmap.folder_id || 'default'

            if (!folderMap[folderId]) {
              folderMap[folderId] = {
                id: folderId,
                name:
                  folderId === 'default' ? 'My Mindmaps' : `Folder ${folderId}`,
                files: [],
                subfolders: [],
                isOpen: true,
              }
            }

            folderMap[folderId].files.push({
              id: mindmap.id,
              name: mindmap.name,
              createdAt: mindmap.created_at,
              updatedAt: mindmap.updated_at,
              nodes: mindmap.nodes || [],
              edges: mindmap.edges || [],
            })
          })

          set({
            folders: Object.values(folderMap),
            activeMindMapId: mindmapsData[0].id,
          })
        } catch (error) {
          console.error('Failed to load mindmaps from Supabase:', error)
          const currentFolders = get().folders
          // Preserve local persisted data on error
          if (currentFolders.some((folder) => folder.files.length > 0)) {
            return
          }
          // Fallback to default folder on error
          set({
            folders: [
              {
                id: 'default',
                name: 'My Mindmaps',
                files: [],
                subfolders: [],
                isOpen: true,
              },
            ],
            activeMindMapId: null,
          })
        }
      },
    }),
    {
      name: 'catalyst-file-system',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
