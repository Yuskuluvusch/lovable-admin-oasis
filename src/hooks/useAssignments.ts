
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AssignmentRecord } from "@/types/territory-types";
import { useAuth } from "@/contexts/AuthContext";

interface AssignmentsData {
  allAssignments: AssignmentRecord[];
  currentAssignmentsCount: number;
  expiredAssignmentsCount: number;
  pendingReturnAssignmentsCount: number;
  isLoading: boolean;
  error: string | null;
}

export function useAssignments(): AssignmentsData {
  const { currentUser } = useAuth();
  const [allAssignments, setAllAssignments] = useState<AssignmentRecord[]>([]);
  const [currentAssignmentsCount, setCurrentAssignmentsCount] = useState<number>(0);
  const [expiredAssignmentsCount, setExpiredAssignmentsCount] = useState<number>(0);
  const [pendingReturnAssignmentsCount, setPendingReturnAssignmentsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      fetchAssignmentsForExport();
    }
  }, [currentUser]);

  const fetchAssignmentsForExport = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("assigned_territories")
        .select(`
          id, territory_id, publisher_id, assigned_at, expires_at, status, token, returned_at
        `);
      
      if (assignmentsError) {
        throw assignmentsError;
      }
      
      if (assignmentsData) {
        // Fetch publisher names separately
        const publisherIds = [...new Set(assignmentsData.map(a => a.publisher_id))];
        const { data: publishersData, error: publishersError } = await supabase
          .from("publishers")
          .select("id, name")
          .in("id", publisherIds);
        
        if (publishersError) {
          console.error("Error fetching publishers:", publishersError);
        }
        
        // Create a map of publisher ID to name
        const publisherMap = new Map();
        if (publishersData) {
          publishersData.forEach(publisher => {
            publisherMap.set(publisher.id, publisher.name);
          });
        }

        const now = new Date();
        
        // Transform data to ensure it matches AssignmentRecord
        const assignmentRecords: AssignmentRecord[] = assignmentsData.map(item => {
          // Check if assignment is expired
          const isExpired = item.expires_at && new Date(item.expires_at) < now;

          // Update status for expired assignments
          let status = item.status || "";
          if (isExpired && status === "assigned" && !item.returned_at) {
            status = "expired";
          }

          return {
            id: item.id,
            territory_id: item.territory_id,
            publisher_id: item.publisher_id,
            assigned_at: item.assigned_at,
            expires_at: item.expires_at,
            status: status,
            token: item.token,
            returned_at: item.returned_at,
            publisher_name: publisherMap.get(item.publisher_id) || "Unknown"
          };
        });
        
        setAllAssignments(assignmentRecords);
        
        // Active assignments are those that are assigned and not expired
        const currentAssignments = assignmentRecords.filter(
          (a) => a.status === "assigned" && !a.returned_at
        );
        
        // Expired assignments
        const expiredAssignments = assignmentRecords.filter(
          (a) => a.status === "expired" && !a.returned_at
        );

        // Pending return (expired for more than 5 days but not yet returned)
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
        
        const pendingReturnAssignments = assignmentRecords.filter(
          (a) => 
            a.status === "expired" && 
            !a.returned_at && 
            a.expires_at && 
            new Date(a.expires_at) < fiveDaysAgo
        );
        
        setCurrentAssignmentsCount(currentAssignments.length);
        setExpiredAssignmentsCount(expiredAssignments.length);
        setPendingReturnAssignmentsCount(pendingReturnAssignments.length);
      }
    } catch (error) {
      console.error("Error fetching assignments for export:", error);
      setError("Error al cargar asignaciones");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    allAssignments,
    currentAssignmentsCount,
    expiredAssignmentsCount,
    pendingReturnAssignmentsCount,
    isLoading,
    error
  };
}
