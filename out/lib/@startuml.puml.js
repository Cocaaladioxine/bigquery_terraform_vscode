"use strict";
!$data;
{
    "user";
    {
        "partition_cols";
        ["col1"],
            "clustering_cols";
        ["col3", "col2"];
    }
    "city";
    {
        "partition_cols";
        ["col2"],
            "clustering_cols";
        ["col4", "col5"];
    }
}
!procedure;
part($table);
!partition_cols_size;
 % size($data[$table].partition_cols);
!$partition_cols;
$data[$table].partition_cols[0];
!loop_idx;
1;
!;
while (loop_idx != partition_cols_size)
    !$partition_cols;
$partition_cols + "," + $data[$table].partition_cols[loop_idx];
!loop_idx;
loop_idx + 1;
!endwhile
    < b > ;
#;
3944;
bc > /color> $partition_cols</b >
    !endprocedure;
!procedure;
cluster($table);
!clustering_cols_size;
 % size($data[$table].clustering_cols);
!$clustering_cols;
$data[$table].clustering_cols[0];
!loop_idx;
1;
!;
while (loop_idx != clustering_cols_size)
    !$clustering_cols;
$clustering_cols + "," + $data[$table].clustering_cols[loop_idx];
!loop_idx;
loop_idx + 1;
!endwhile
    < b > ;
#;
3944;
bc > /color> $clustering_cols</b >
    !endprocedure;
!define;
primary_key(x) < b > ;
 > /color> x</b >
    !define;
foreign_key(x) < color;
 > /color> x;
!define;
column(x) < color;
 > -record > /color> x;
!define;
table(x);
entity;
x << (T, white) >>
    entity;
table << (T, white) >> {}
    < b > ;
#;
3944;
bc > /color> </b > ;
10 > -right > //Partitioning column-s//</size> 
;
#;
3944;
bc > /color> </b > ;
10 > -right > //Clustering column-s//</size> 
    -- -
;
 > /color> </b > ;
10 > -right > //Primary Key-s//</size> 
;
 > /color> </b > ;
10 > -right >
; //Foreign Key-s//</size> 
table(user);
{
    part("user");
    cluster("user");
    -- -
        primary_key(id);
    INTEGER;
    column(isActive);
    BOOLEAN;
    foreign_key(cityId);
    INTEGER;
}
table(city);
{
    part("city");
    cluster("city");
    -- -
        primary_key(id);
    INTEGER;
    column(name);
    STRING;
    column(country);
    STRING;
    column(postCode);
    INTEGER;
}
user;
 | -- || city;
//# sourceMappingURL=@startuml.puml.js.map