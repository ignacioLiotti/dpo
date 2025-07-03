'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { 
  createFieldDefinitionAction, 
  updateFieldDefinitionAction, 
  deleteFieldDefinitionAction,
  applyTemplateAction,
  getFieldDefinitionsAction 
} from '../../lib/actions/data-extraction-actions';

interface FieldDefinition {
  id?: string;
  field_name: string;
  field_type: 'text' | 'number' | 'date' | 'currency' | 'boolean' | 'email' | 'phone';
  field_label: string;
  field_description?: string;
  extraction_method: 'regex' | 'ai' | 'hybrid';
  extraction_pattern: string;
  validation_pattern?: string;
  is_required: boolean;
  default_value?: string;
  sort_order: number;
  is_active?: boolean;
}

interface FolderFieldManagerProps {
  obraId: string;
  folderName: string;
  isOpen: boolean;
  onClose: () => void;
  onFieldsUpdated?: () => void;
}

export const FolderFieldManager: React.FC<FolderFieldManagerProps> = ({
  obraId,
  folderName,
  isOpen,
  onClose,
  onFieldsUpdated
}) => {
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingField, setEditingField] = useState<FieldDefinition | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadFields();
    }
  }, [isOpen, obraId, folderName]);

  const loadFields = async () => {
    setLoading(true);
    try {
      const result = await getFieldDefinitionsAction({
        obra_id: obraId,
        folder_name: folderName,
      });

      if (result?.data?.success) {
        setFields(result.data.data || []);
      }
    } catch (error) {
      console.error('Error loading fields:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveField = async (field: FieldDefinition) => {
    try {
      if (field.id) {
        // Update existing field
        const result = await updateFieldDefinitionAction({
          id: field.id,
          field_label: field.field_label,
          field_description: field.field_description,
          extraction_pattern: field.extraction_pattern,
          validation_pattern: field.validation_pattern,
          is_required: field.is_required,
          default_value: field.default_value,
          sort_order: field.sort_order,
        });

        if (result?.data?.success) {
          await loadFields();
          setEditingField(null);
          onFieldsUpdated?.();
        }
      } else {
        // Create new field
        const result = await createFieldDefinitionAction({
          obra_id: obraId,
          folder_name: folderName,
          field_name: field.field_name,
          field_type: field.field_type,
          field_label: field.field_label,
          field_description: field.field_description,
          extraction_method: field.extraction_method,
          extraction_pattern: field.extraction_pattern,
          validation_pattern: field.validation_pattern,
          is_required: field.is_required,
          default_value: field.default_value,
          sort_order: field.sort_order,
        });

        if (result?.data?.success) {
          await loadFields();
          setShowAddForm(false);
          onFieldsUpdated?.();
        }
      }
    } catch (error) {
      console.error('Error saving field:', error);
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    if (!confirm('Are you sure you want to delete this field definition?')) {
      return;
    }

    try {
      const result = await deleteFieldDefinitionAction({ id: fieldId });
      
      if (result?.data?.success) {
        await loadFields();
        onFieldsUpdated?.();
      }
    } catch (error) {
      console.error('Error deleting field:', error);
    }
  };

  const handleApplyTemplate = async (templateName: 'invoices' | 'contracts' | 'permits') => {
    try {
      console.log('Applying template:', templateName, 'to obra:', obraId, 'folder:', folderName);
      
      const result = await applyTemplateAction({
        obra_id: obraId,
        folder_name: folderName,
        template_name: templateName,
      });

      console.log('Template application result:', result);

      if (result?.data?.success) {
        console.log('Template applied successfully, reloading fields');
        await loadFields();
        onFieldsUpdated?.();
      } else {
        console.error('Template application failed:', result?.data?.error);
        alert(`Failed to apply template: ${result?.data?.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error applying template:', error);
      alert(`Error applying template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>🔧</span>
            Manage Fields for "{folderName}" Folder
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Templates Section */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold mb-3">Quick Templates</h3>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => handleApplyTemplate('invoices')}
                variant="outline"
                size="sm"
              >
                📄 Apply Invoice Template
              </Button>
              <Button
                onClick={() => handleApplyTemplate('contracts')}
                variant="outline"
                size="sm"
              >
                📋 Apply Contract Template
              </Button>
              <Button
                onClick={() => handleApplyTemplate('permits')}
                variant="outline"
                size="sm"
              >
                🏛️ Apply Permit Template
              </Button>
            </div>
          </div>

          {/* Fields List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Field Definitions</h3>
              <Button
                onClick={() => setShowAddForm(true)}
                size="sm"
              >
                ➕ Add Field
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-4">Loading fields...</div>
            ) : fields.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📝</div>
                <p>No field definitions yet</p>
                <p className="text-sm">Add fields or apply a template to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {fields.map((field) => (
                  <FieldDefinitionCard
                    key={field.id}
                    field={field}
                    onEdit={() => setEditingField(field)}
                    onDelete={() => handleDeleteField(field.id!)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Add/Edit Form */}
          {(showAddForm || editingField) && (
            <FieldDefinitionForm
              field={editingField || {
                field_name: '',
                field_type: 'text',
                field_label: '',
                extraction_method: 'regex',
                extraction_pattern: '',
                is_required: false,
                sort_order: fields.length,
              }}
              onSave={handleSaveField}
              onCancel={() => {
                setShowAddForm(false);
                setEditingField(null);
              }}
              isEditing={!!editingField}
            />
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const FieldDefinitionCard: React.FC<{
  field: FieldDefinition;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ field, onEdit, onDelete }) => {
  const getFieldTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return '📝';
      case 'number': return '🔢';
      case 'date': return '📅';
      case 'currency': return '💰';
      case 'boolean': return '☑️';
      case 'email': return '📧';
      case 'phone': return '📞';
      default: return '📄';
    }
  };

  const getMethodBadge = (method: string) => {
    const styles = {
      regex: 'bg-blue-100 text-blue-800',
      ai: 'bg-purple-100 text-purple-800',
      hybrid: 'bg-green-100 text-green-800',
    };
    return styles[method as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getFieldTypeIcon(field.field_type)}</span>
          <div>
            <h4 className="font-semibold">{field.field_label}</h4>
            <p className="text-sm text-gray-500">
              {field.field_name} • {field.field_type}
              {field.is_required && <span className="text-red-500"> *</span>}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs rounded ${getMethodBadge(field.extraction_method)}`}>
            {field.extraction_method}
          </span>
          <Button onClick={onEdit} variant="outline" size="sm">
            ✏️
          </Button>
          <Button onClick={onDelete} variant="outline" size="sm">
            🗑️
          </Button>
        </div>
      </div>
      
      {field.field_description && (
        <p className="text-sm text-gray-600">{field.field_description}</p>
      )}
      
      <div className="text-sm">
        <p className="font-mono bg-gray-50 p-2 rounded">
          {field.extraction_pattern}
        </p>
      </div>
    </div>
  );
};

const FieldDefinitionForm: React.FC<{
  field: FieldDefinition;
  onSave: (field: FieldDefinition) => void;
  onCancel: () => void;
  isEditing: boolean;
}> = ({ field, onSave, onCancel, isEditing }) => {
  const [formData, setFormData] = useState<FieldDefinition>(field);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <h4 className="text-lg font-semibold mb-4">
        {isEditing ? 'Edit Field' : 'Add New Field'}
      </h4>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Field Name</label>
            <input
              type="text"
              value={formData.field_name}
              onChange={(e) => setFormData({ ...formData, field_name: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="invoice_number"
              disabled={isEditing}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Field Label</label>
            <input
              type="text"
              value={formData.field_label}
              onChange={(e) => setFormData({ ...formData, field_label: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Invoice Number"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Field Type</label>
            <select
              value={formData.field_type}
              onChange={(e) => setFormData({ ...formData, field_type: e.target.value as any })}
              className="w-full p-2 border rounded"
              disabled={isEditing}
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
              <option value="currency">Currency</option>
              <option value="boolean">Boolean</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Extraction Method</label>
            <select
              value={formData.extraction_method}
              onChange={(e) => setFormData({ ...formData, extraction_method: e.target.value as any })}
              className="w-full p-2 border rounded"
            >
              <option value="regex">Regex Pattern</option>
              <option value="ai">AI Extraction</option>
              <option value="hybrid">Hybrid (Regex + AI)</option>
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            {formData.extraction_method === 'ai' ? 'AI Prompt' : 'Extraction Pattern'}
          </label>
          <textarea
            value={formData.extraction_pattern}
            onChange={(e) => setFormData({ ...formData, extraction_pattern: e.target.value })}
            className="w-full p-2 border rounded h-24"
            placeholder={
              formData.extraction_method === 'ai' 
                ? "Find the invoice number in this document..."
                : "(?:invoice|factura)\\s*#?\\s*([A-Z0-9-]+)"
            }
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <input
            type="text"
            value={formData.field_description || ''}
            onChange={(e) => setFormData({ ...formData, field_description: e.target.value })}
            className="w-full p-2 border rounded"
            placeholder="Optional description for this field"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Validation Pattern</label>
            <input
              type="text"
              value={formData.validation_pattern || ''}
              onChange={(e) => setFormData({ ...formData, validation_pattern: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="^[A-Z0-9-]+$"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Default Value</label>
            <input
              type="text"
              value={formData.default_value || ''}
              onChange={(e) => setFormData({ ...formData, default_value: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="N/A"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Sort Order</label>
            <input
              type="number"
              value={formData.sort_order}
              onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
              className="w-full p-2 border rounded"
              min="0"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_required"
            checked={formData.is_required}
            onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
          />
          <label htmlFor="is_required" className="text-sm">Required field</label>
        </div>
        
        <div className="flex gap-2 pt-4">
          <Button type="submit">
            {isEditing ? 'Update Field' : 'Add Field'}
          </Button>
          <Button type="button" onClick={onCancel} variant="outline">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};