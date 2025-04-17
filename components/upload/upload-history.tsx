import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, FileText, Video, MoreHorizontal, Eye } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function UploadHistory() {
  // Mock data for upload history
  const uploads = [
    {
      id: 1,
      filename: "Biology_Notes.pdf",
      uploadDate: "Today, 2:30 PM",
      status: "completed",
      videoTitle: "Introduction to Biology",
    },
    {
      id: 2,
      filename: "Math_Formulas.docx",
      uploadDate: "Today, 10:15 AM",
      status: "processing",
      videoTitle: "Math Formulas Explained",
    },
    {
      id: 3,
      filename: "History_Timeline.pptx",
      uploadDate: "Yesterday",
      status: "completed",
      videoTitle: "History of Ancient Civilizations",
    },
    {
      id: 4,
      filename: "Physics_Chapter1.pdf",
      uploadDate: "3 days ago",
      status: "failed",
      videoTitle: "Physics Fundamentals",
    },
  ]

  return (
    <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-500" />
          Upload History
        </CardTitle>
        <CardDescription>Your recent document uploads and their conversion status</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File Name</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Video</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {uploads.map((upload) => (
              <TableRow key={upload.id}>
                <TableCell className="font-medium">{upload.filename}</TableCell>
                <TableCell>{upload.uploadDate}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`${
                      upload.status === "completed"
                        ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
                        : upload.status === "processing"
                          ? "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
                          : "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
                    }`}
                  >
                    {upload.status === "completed" ? (
                      <Video className="h-3 w-3 mr-1" />
                    ) : upload.status === "processing" ? (
                      <Clock className="h-3 w-3 mr-1 animate-pulse" />
                    ) : (
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 15 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 mr-1"
                      >
                        <path
                          d="M5.5 1C5.22386 1 5 1.22386 5 1.5C5 1.77614 5.22386 2 5.5 2H9.5C9.77614 2 10 1.77614 10 1.5C10 1.22386 9.77614 1 9.5 1H5.5ZM3 3.5C3 3.22386 3.22386 3 3.5 3H11.5C11.7761 3 12 3.22386 12 3.5C12 3.77614 11.7761 4 11.5 4H3.5C3.22386 4 3 3.77614 3 3.5ZM0 7.5C0 5.567 1.567 4 3.5 4H11.5C13.433 4 15 5.567 15 7.5V11.5C15 13.433 13.433 15 11.5 15H3.5C1.567 15 0 13.433 0 11.5V7.5ZM7.5 6C7.22386 6 7 6.22386 7 6.5V8.5C7 8.77614 7.22386 9 7.5 9C7.77614 9 8 8.77614 8 8.5V6.5C8 6.22386 7.77614 6 7.5 6ZM7.5 10C7.22386 10 7 10.2239 7 10.5C7 10.7761 7.22386 11 7.5 11C7.77614 11 8 10.7761 8 10.5C8 10.2239 7.77614 10 7.5 10Z"
                          fill="currentColor"
                          fillRule="evenodd"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    )}
                    {upload.status === "completed"
                      ? "Completed"
                      : upload.status === "processing"
                        ? "Processing"
                        : "Failed"}
                  </Badge>
                </TableCell>
                <TableCell>{upload.videoTitle}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem disabled={upload.status !== "completed"}>
                        <Eye className="mr-2 h-4 w-4" />
                        <span>View Video</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <FileText className="mr-2 h-4 w-4" />
                        <span>View Document</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled={upload.status !== "failed"}>
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 15 15"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="mr-2 h-4 w-4"
                        >
                          <path
                            d="M1.90321 7.29677C1.90321 10.341 4.11041 12.4147 6.58893 12.8439C6.87255 12.893 7.06266 13.1627 7.01355 13.4464C6.96444 13.73 6.69471 13.9201 6.41109 13.871C3.49942 13.3668 0.86084 10.9127 0.86084 7.29677C0.860839 5.76009 1.55996 4.55245 2.37639 3.63377C2.96124 2.97568 3.63034 2.44135 4.16846 2.03202L2.53205 2.03202C2.25591 2.03202 2.03205 1.80816 2.03205 1.53202C2.03205 1.25588 2.25591 1.03202 2.53205 1.03202L5.53205 1.03202C5.80819 1.03202 6.03205 1.25588 6.03205 1.53202L6.03205 4.53202C6.03205 4.80816 5.80819 5.03202 5.53205 5.03202C5.25591 5.03202 5.03205 4.80816 5.03205 4.53202L5.03205 2.68645L5.03054 2.68759L5.03045 2.68766L5.03044 2.68767L5.03043 2.68767C4.45896 3.11868 3.76059 3.64538 3.15554 4.3262C2.44102 5.13021 1.90321 6.10154 1.90321 7.29677ZM13.0109 7.70321C13.0109 4.69115 10.8505 2.6296 8.40384 2.17029C8.12093 2.11718 7.93465 1.84479 7.98776 1.56188C8.04087 1.27898 8.31326 1.0927 8.59616 1.14581C11.4704 1.68541 14.0532 4.12605 14.0532 7.70321C14.0532 9.23988 13.3541 10.4475 12.5377 11.3662C11.9528 12.0243 11.2837 12.5586 10.7456 12.968L12.3821 12.968C12.6582 12.968 12.8821 13.1918 12.8821 13.468C12.8821 13.7441 12.6582 13.968 12.3821 13.968L9.38205 13.968C9.10591 13.968 8.88205 13.7441 8.88205 13.468L8.88205 10.468C8.88205 10.1918 9.10591 9.96796 9.38205 9.96796C9.65819 9.96796 9.88205 10.1918 9.88205 10.468L9.88205 12.3135L9.88362 12.3123C10.4551 11.8813 11.1535 11.3546 11.7585 10.6738C12.4731 9.86976 13.0109 8.89844 13.0109 7.70321Z"
                            fill="currentColor"
                            fillRule="evenodd"
                            clipRule="evenodd"
                          ></path>
                        </svg>
                        <span>Retry</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-500">
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 15 15"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="mr-2 h-4 w-4 text-red-500"
                        >
                          <path
                            d="M5.5 1C5.22386 1 5 1.22386 5 1.5C5 1.77614 5.22386 2 5.5 2H9.5C9.77614 2 10 1.77614 10 1.5C10 1.22386 9.77614 1 9.5 1H5.5ZM3 3.5C3 3.22386 3.22386 3 3.5 3H11.5C11.7761 3 12 3.22386 12 3.5C12 3.77614 11.7761 4 11.5 4H3.5C3.22386 4 3 3.77614 3 3.5ZM1 5.5C1 5.22386 1.22386 5 1.5 5H13.5C13.7761 5 14 5.22386 14 5.5C14 5.77614 13.7761 6 13.5 6H1.5C1.22386 6 1 5.77614 1 5.5ZM4 8.5C4 7.11929 5.11929 6 6.5 6H8.5C9.88071 6 11 7.11929 11 8.5V13C11 13.5523 10.5523 14 10 14H5C4.44772 14 4 13.5523 4 13V8.5Z"
                            fill="currentColor"
                            fillRule="evenodd"
                            clipRule="evenodd"
                          ></path>
                        </svg>
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
