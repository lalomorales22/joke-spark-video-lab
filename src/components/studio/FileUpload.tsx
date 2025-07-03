import { useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Video, Image, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  title: string;
  description: string;
  accept: string;
  icon: "video" | "image" | "avatar";
  file: File | null;
  onFileSelect: (file: File) => void;
  preview?: string;
  step: number;
}

const FileUpload = ({
  title,
  description,
  accept,
  icon,
  file,
  onFileSelect,
  preview,
  step
}: FileUploadProps) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  const getIcon = () => {
    switch (icon) {
      case "video":
        return <Video className="w-8 h-8" />;
      case "image":
        return <Image className="w-8 h-8" />;
      case "avatar":
        return <User className="w-8 h-8" />;
    }
  };

  const getAccentColor = () => {
    switch (icon) {
      case "video":
        return "studio-blue";
      case "image":
        return "studio-pink";
      case "avatar":
        return "studio-purple";
    }
  };

  return (
    <Card className="bg-card border-border/50 shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className={`text-${getAccentColor()}`}>
            {getIcon()}
          </div>
          Step {step}: {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "border-2 border-dashed border-border/50 rounded-lg p-8 text-center transition-all duration-300",
            "hover:border-studio-purple/50 hover:bg-muted/20",
            file && "border-studio-success/50 bg-studio-success/10"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {preview && icon !== "video" ? (
            <div className="space-y-4">
              <img
                src={preview}
                alt="Preview"
                className={cn(
                  "mx-auto rounded-lg shadow-md",
                  icon === "avatar" ? "w-24 h-24 object-cover rounded-full" : "max-w-full max-h-32 object-contain"
                )}
              />
              <p className="text-sm text-muted-foreground">{file?.name}</p>
            </div>
          ) : file ? (
            <div className="space-y-2">
              <div className={`text-${getAccentColor()} mx-auto`}>
                {getIcon()}
              </div>
              <p className="font-medium text-foreground">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-muted-foreground mx-auto">
                <Upload className="w-12 h-12" />
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">{description}</p>
                <p className="text-sm text-muted-foreground">
                  Drag and drop or click to browse
                </p>
              </div>
            </div>
          )}
          
          <input
            type="file"
            accept={accept}
            onChange={handleFileInput}
            className="hidden"
            id={`file-input-${step}`}
          />
          
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => document.getElementById(`file-input-${step}`)?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            Choose File
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FileUpload;