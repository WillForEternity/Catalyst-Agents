'use client'

import { useEffect, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  File,
  Folder,
  Plus,
  MoreHorizontal,
  X,
} from 'lucide-react'
import {
  useFileSystemStore,
  Folder as FolderType,
  MindMapFile,
} from '@/store/file-system-store'
import { useMindMapStore } from '@/store/mindmap-store'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function FileExplorer() {
  const {
    folders,
    activeMindMapId,
    createFolder,
    createMindMap,
    deleteMindMap,
    deleteFolder,
    renameMindMap,
    renameFolder,
    setActiveMindMap,
    toggleFolder,
    loadMindMaps,
  } = useFileSystemStore()

  const { setNodes, setEdges } = useMindMapStore()

  const [isCreateFolderDialogOpen, setIsCreateFolderDialogOpen] =
    useState(false)
  const [isCreateFileDialogOpen, setIsCreateFileDialogOpen] = useState(false)
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFileName, setNewFileName] = useState('')
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [itemToRename, setItemToRename] = useState<{
    id: string
    name: string
    type: 'file' | 'folder'
    folderId?: string
  } | null>(null)

  // Load mindmaps on component mount
  useEffect(() => {
    loadMindMaps()
  }, [loadMindMaps])

  // Load active mindmap when it changes
  useEffect(() => {
    if (activeMindMapId) {
      // Find the active mindmap
      let activeMindMap: MindMapFile | null = null

      for (const folder of folders) {
        const file = folder.files.find((file) => file.id === activeMindMapId)
        if (file) {
          activeMindMap = file
          break
        }
      }

      if (activeMindMap) {
        setNodes(activeMindMap.nodes)
        setEdges(activeMindMap.edges)
      }
    }
  }, [activeMindMapId, folders, setNodes, setEdges])

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolder(newFolderName)
      setNewFolderName('')
      setIsCreateFolderDialogOpen(false)
    }
  }

  const handleCreateFile = () => {
    if (newFileName.trim() && selectedFolderId) {
      createMindMap(selectedFolderId, newFileName)
      setNewFileName('')
      setIsCreateFileDialogOpen(false)
    }
  }

  const handleRenameItem = () => {
    if (itemToRename && itemToRename.name.trim()) {
      if (itemToRename.type === 'folder') {
        renameFolder(itemToRename.id, itemToRename.name)
      } else if (itemToRename.type === 'file' && itemToRename.folderId) {
        renameMindMap(itemToRename.folderId, itemToRename.id, itemToRename.name)
      }
      setIsRenameDialogOpen(false)
      setItemToRename(null)
    }
  }

  const openCreateFileDialog = (folderId: string) => {
    setSelectedFolderId(folderId)
    setIsCreateFileDialogOpen(true)
  }

  const openRenameDialog = (
    id: string,
    name: string,
    type: 'file' | 'folder',
    folderId?: string,
  ) => {
    setItemToRename({ id, name, type, folderId })
    setIsRenameDialogOpen(true)
  }

  const renderFolder = (folder: FolderType) => {
    return (
      <div key={folder.id} className="select-none">
        <div className="group flex items-center rounded-md px-2 py-1 hover:bg-accent/50">
          <button
            onClick={() => toggleFolder(folder.id)}
            className="mr-1 flex items-center"
          >
            {folder.isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <Folder className="mr-2 h-4 w-4 text-blue-500" />
            <span className="text-sm">{folder.name}</span>
          </button>

          <div className="ml-auto flex items-center opacity-0 group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => openCreateFileDialog(folder.id)}
            >
              <Plus className="h-3 w-3" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() =>
                    openRenameDialog(folder.id, folder.name, 'folder')
                  }
                >
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => deleteFolder(folder.id)}
                  className="text-red-500"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {folder.isOpen && (
          <div className="ml-5 border-l border-border pl-2">
            {folder.files.map((file) => (
              <div
                key={file.id}
                className={`group flex items-center rounded-md px-2 py-1 hover:bg-accent/50 ${
                  activeMindMapId === file.id ? 'bg-accent' : ''
                }`}
              >
                <button
                  onClick={() => setActiveMindMap(file.id)}
                  className="flex flex-1 items-center overflow-hidden"
                >
                  <File className="mr-2 h-4 w-4 flex-shrink-0 text-green-500" />
                  <span className="truncate text-sm">{file.name}</span>
                </button>

                <div className="ml-auto flex items-center opacity-0 group-hover:opacity-100">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          openRenameDialog(
                            file.id,
                            file.name,
                            'file',
                            folder.id,
                          )
                        }
                      >
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => deleteMindMap(folder.id, file.id)}
                        className="text-red-500"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-2">
        <h2 className="text-sm font-medium">Catalyst Agents</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCreateFolderDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {folders.map(renderFolder)}

        {folders.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
            <Folder className="mb-2 h-10 w-10" />
            <p className="text-sm">No folders yet</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setIsCreateFolderDialogOpen(true)}
            >
              Create Folder
            </Button>
          </div>
        )}
      </div>

      {/* Create Folder Dialog */}
      <Dialog
        open={isCreateFolderDialogOpen}
        onOpenChange={setIsCreateFolderDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="folderName" className="text-right">
                Name
              </Label>
              <Input
                id="folderName"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="col-span-3"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateFolderDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create File Dialog */}
      <Dialog
        open={isCreateFileDialogOpen}
        onOpenChange={setIsCreateFileDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Mindmap</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fileName" className="text-right">
                Name
              </Label>
              <Input
                id="fileName"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                className="col-span-3"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateFileDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateFile}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              Rename {itemToRename?.type === 'folder' ? 'Folder' : 'Mindmap'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="itemName" className="text-right">
                Name
              </Label>
              <Input
                id="itemName"
                value={itemToRename?.name || ''}
                onChange={(e) =>
                  setItemToRename(
                    itemToRename
                      ? { ...itemToRename, name: e.target.value }
                      : null,
                  )
                }
                className="col-span-3"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRenameDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleRenameItem}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
