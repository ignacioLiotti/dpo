'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronDown, Folder as FolderIcon, File, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/utils';
import type { ObraDocument, Folder } from '../types';

interface DocumentTreeViewProps {
  folders: Folder[];
  documents: ObraDocument[];
  currentFolder: Folder | null;
  searchParams: {
    search?: string;
    category?: string;
    folder?: string;
  };
}

interface TreeNode {
  id: string;
  name: string;
  type: 'folder' | 'document';
  children?: TreeNode[];
  document?: ObraDocument;
  folder?: Folder;
}

export function DocumentTreeView({
  folders,
  documents,
  currentFolder,
  searchParams
}: DocumentTreeViewProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(currentFolder ? [currentFolder.id] : [])
  );

  // Build tree structure
  const buildTree = (): TreeNode[] => {
    const tree: TreeNode[] = [];

    // Add root-level documents (documents without folder)
    const rootDocuments = documents.filter(doc => !doc.folder_id);
    rootDocuments.forEach(doc => {
      tree.push({
        id: doc.id,
        name: doc.name,
        type: 'document',
        document: doc
      });
    });

    // Add folders with their documents
    folders.forEach(folder => {
      const folderDocuments = documents.filter(doc => doc.folder_id === folder.id);
      const folderNode: TreeNode = {
        id: folder.id,
        name: folder.name,
        type: 'folder',
        folder: folder,
        children: folderDocuments.map(doc => ({
          id: doc.id,
          name: doc.name,
          type: 'document',
          document: doc
        }))
      };
      tree.push(folderNode);
    });

    return tree;
  };

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const buildQuery = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    Object.entries({ ...searchParams, ...updates }).forEach(([key, value]) => {
      if (value && value !== '') {
        params.set(key, value);
      }
    });
    return params.toString();
  };

  const renderTreeNode = (node: TreeNode, level: number = 0) => {
    const isExpanded = expandedFolders.has(node.id);
    const isCurrentFolder = currentFolder?.id === node.id;
    const indentClass = level > 0 ? `ml-${level * 4}` : '';

    if (node.type === 'folder') {
      return (
        <div key={node.id} className="space-y-1">
          <div className={cn("flex items-center gap-1", indentClass)}>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => toggleFolder(node.id)}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>

            <Link
              href={`/obra-files?${buildQuery({ folder: node.id })}`}
              className={cn(
                "flex items-center gap-2 px-2 py-1 rounded text-sm hover:bg-muted transition-colors flex-1",
                isCurrentFolder && "bg-muted font-medium"
              )}
            >
              {isExpanded ? (
                <FolderOpen className="h-4 w-4 text-blue-600" />
              ) : (
                <FolderIcon className="h-4 w-4 text-blue-600" />
              )}
              <span className="truncate">{node.name}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {node.children?.length || 0}
              </span>
            </Link>
          </div>

          {isExpanded && node.children && (
            <div className="space-y-1">
              {node.children.map(child => renderTreeNode(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    // Document node
    return (
      <div
        key={node.id}
        className={cn("flex items-center gap-2 px-2 py-1 text-sm text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer rounded", indentClass)}
      >
        <File className="h-3 w-3 ml-6" />
        <span className="truncate text-xs">{node.name}</span>
      </div>
    );
  };

  const treeNodes = buildTree();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-muted-foreground">Structure</h4>
        <Link
          href={`/obra-files?${buildQuery({ folder: undefined })}`}
          className={cn(
            "text-xs px-2 py-1 rounded hover:bg-muted transition-colors",
            !currentFolder && "bg-muted font-medium"
          )}
        >
          Root
        </Link>
      </div>

      <div className="max-h-96 overflow-y-auto space-y-1">
        {treeNodes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <FolderIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No hay carpetas</p>
          </div>
        ) : (
          treeNodes.map(node => renderTreeNode(node))
        )}
      </div>
    </div>
  );
} 